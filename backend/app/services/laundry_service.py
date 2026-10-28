import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.models.laundry import (
    LaundryOrder,
    LaundryOrderItem,
    LaundryRate,
    LaundrySlot,
    LaundryStatusEvent,
    LaundryOrderStatus,
    LaundryServiceType
)
from backend.app.schemas.laundry import (
    LaundryOrderCreate,
    LaundryCountConfirmation,
    LaundryStatusUpdate,
    LaundryRateCreate
)

DEFAULT_RATES: Dict[str, float] = {
    "SHIRT": 15.0,
    "TROUSER": 18.0,
    "BEDSHEET": 35.0,
    "TOWEL": 12.0,
    "JACKET": 45.0,
    "OTHER": 20.0
}

class LaundryService:
    @staticmethod
    def seed_default_rates(db: Session):
        if db.query(LaundryRate).count() == 0:
            for cat, price in DEFAULT_RATES.items():
                rate = LaundryRate(
                    item_category=cat,
                    service_type=LaundryServiceType.WASH_AND_IRON,
                    rate_per_piece=price
                )
                db.add(rate)
            db.commit()

    @staticmethod
    def get_rates(db: Session) -> List[LaundryRate]:
        LaundryService.seed_default_rates(db)
        return db.query(LaundryRate).filter(LaundryRate.is_active == "TRUE").all()

    @staticmethod
    def book_order(db: Session, data: LaundryOrderCreate) -> LaundryOrder:
        LaundryService.seed_default_rates(db)

        # 1. Atomic capacity check for selected slot
        slot = db.query(LaundrySlot).filter(
            LaundrySlot.slot_date == data.pickup_date,
            LaundrySlot.time_window == data.pickup_time_slot
        ).first()

        if not slot:
            # Create slot on-the-fly with default capacity 15
            slot = LaundrySlot(
                slot_date=data.pickup_date,
                time_window=data.pickup_time_slot,
                max_capacity=15,
                booked_count=0
            )
            db.add(slot)
            db.flush()

        if slot.booked_count >= slot.max_capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Slot '{data.pickup_time_slot}' on {data.pickup_date} is fully booked (Capacity: {slot.max_capacity}). Please choose another slot."
            )

        slot.booked_count += 1

        # 2. Server-Side Price Calculation from database rates (Never trust frontend amounts)
        rate_map = {r.item_category.upper(): r.rate_per_piece for r in db.query(LaundryRate).all()}
        for cat, price in DEFAULT_RATES.items():
            if cat not in rate_map:
                rate_map[cat] = price

        total_pieces = 0
        total_estimated = 0.0
        order_items = []

        for item_in in data.items:
            cat_upper = item_in.item_category.upper()
            unit_price = rate_map.get(cat_upper, 20.0)
            item_total = unit_price * item_in.quantity
            total_pieces += item_in.quantity
            total_estimated += item_total

            order_items.append(
                LaundryOrderItem(
                    item_category=cat_upper,
                    quantity_submitted=item_in.quantity,
                    unit_rate=unit_price,
                    total_price=item_total
                )
            )

        order_ref = f"LND-{datetime.now().year}-{secrets.randbelow(9000) + 1000}"
        billing_status = "BILLED_TO_FEES" if data.bill_to_fees else "PENDING"
        fee_ref = f"FEE-LND-{uuid_short()}" if data.bill_to_fees else None

        order = LaundryOrder(
            order_ref=order_ref,
            student_id=data.student_id,
            student_name=data.student_name,
            room_number=data.room_number,
            block_name=data.block_name,
            service_type=data.service_type,
            slot_id=slot.id,
            pickup_date=data.pickup_date,
            pickup_time_slot=data.pickup_time_slot,
            submitted_item_count=total_pieces,
            estimated_amount=round(total_estimated, 2),
            final_amount=round(total_estimated, 2),
            billing_status=billing_status,
            fee_transaction_id=fee_ref,
            status=LaundryOrderStatus.REQUESTED,
            special_instructions=data.special_instructions
        )
        db.add(order)
        db.flush()

        for oi in order_items:
            oi.order_id = order.id
            db.add(oi)

        event = LaundryStatusEvent(
            order_id=order.id,
            status="REQUESTED",
            actor_id=data.student_id,
            actor_role="student",
            notes=f"Order booked for {total_pieces} items. Est charge: ₹{total_estimated}."
        )
        db.add(event)

        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def confirm_item_counts(db: Session, order_id: str, confirmation: LaundryCountConfirmation) -> LaundryOrder:
        order = db.query(LaundryOrder).filter(LaundryOrder.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Laundry order not found")

        rate_map = {r.item_category.upper(): r.rate_per_piece for r in db.query(LaundryRate).all()}
        confirmed_total_count = 0
        recalculated_final = 0.0
        mismatch = False

        for conf_item in confirmation.confirmed_counts:
            cat_upper = conf_item.item_category.upper()
            unit_price = rate_map.get(cat_upper, 20.0)
            confirmed_total_count += conf_item.quantity
            recalculated_final += (unit_price * conf_item.quantity)

            # Match against existing item in order
            matched_item = next((oi for oi in order.items if oi.item_category == cat_upper), None)
            if matched_item:
                if matched_item.quantity_submitted != conf_item.quantity:
                    mismatch = True
                matched_item.quantity_confirmed = conf_item.quantity
                matched_item.total_price = unit_price * conf_item.quantity

        order.confirmed_item_count = confirmed_total_count
        order.final_amount = round(recalculated_final, 2)
        order.count_mismatch_noted = "TRUE" if mismatch else "FALSE"
        order.status = LaundryOrderStatus.COLLECTED

        event = LaundryStatusEvent(
            order_id=order.id,
            status="COLLECTED",
            actor_id=confirmation.staff_id,
            actor_role="staff",
            notes=f"Intake verification by {confirmation.staff_name}. Confirmed {confirmed_total_count} items (Mismatch noted: {mismatch}). Adjusted final: ₹{order.final_amount}."
        )
        db.add(event)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def update_status(db: Session, order_id: str, update: LaundryStatusUpdate) -> LaundryOrder:
        order = db.query(LaundryOrder).filter(LaundryOrder.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        order.status = update.status
        order.status_notes = update.notes

        event = LaundryStatusEvent(
            order_id=order.id,
            status=update.status.value,
            actor_id=update.actor_id,
            actor_role="staff",
            notes=f"Status advanced to {update.status.value} by {update.actor_name}. {update.notes or ''}".strip()
        )
        db.add(event)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get_stats(db: Session):
        today_str = datetime.now().strftime("%Y-%m-%d")
        pickups = db.query(LaundryOrder).filter(LaundryOrder.pickup_date == today_str).count()
        processing = db.query(LaundryOrder).filter(
            LaundryOrder.status.in_([LaundryOrderStatus.COLLECTED, LaundryOrderStatus.PROCESSING])
        ).count()
        ready = db.query(LaundryOrder).filter(LaundryOrder.status == LaundryOrderStatus.READY_FOR_COLLECTION).count()
        delivered = db.query(LaundryOrder).filter(LaundryOrder.status == LaundryOrderStatus.DELIVERED).count()
        
        all_completed = db.query(LaundryOrder).all()
        rev = sum(o.final_amount for o in all_completed if o.status == LaundryOrderStatus.DELIVERED)

        return {
            "today_pickups": pickups,
            "in_processing": processing,
            "ready_for_delivery": ready,
            "completed_orders": delivered,
            "total_revenue": round(rev, 2)
        }

def uuid_short():
    return secrets.token_hex(3).upper()
