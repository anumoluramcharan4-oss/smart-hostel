PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE visitors (
	id VARCHAR NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	phone VARCHAR(20) NOT NULL, 
	email VARCHAR(120), 
	id_proof_type VARCHAR(50), 
	id_proof_number VARCHAR(50), 
	category VARCHAR(17) NOT NULL, 
	host_student_id VARCHAR(50) NOT NULL, 
	host_student_name VARCHAR(100) NOT NULL, 
	host_student_room VARCHAR(50), 
	host_student_block VARCHAR(50), 
	purpose VARCHAR(255) NOT NULL, 
	expected_arrival DATETIME NOT NULL, 
	expected_departure DATETIME NOT NULL, 
	status VARCHAR(16) NOT NULL, 
	notes TEXT, 
	reviewed_by VARCHAR(100), 
	reviewed_at DATETIME, 
	rejection_reason TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO visitors VALUES('d0971b75-ec9d-4615-97a6-afe3c42ef0a0','ram','9090909000',NULL,NULL,NULL,'PARENT','STU101','Alex Johnson','204','Block A','luggage','2026-10-29 14:00:00.000000','2026-10-29 17:00:00.000000','APPROVED',NULL,'SYSTEM_AUTO_POLICY','2026-10-29 08:55:39.682025',NULL,'2026-10-29 08:55:39.683217','2026-10-29 08:55:39.683220');
CREATE TABLE visitor_passes (
	id VARCHAR NOT NULL, 
	visitor_id VARCHAR NOT NULL, 
	pass_code VARCHAR(64) NOT NULL, 
	valid_from DATETIME NOT NULL, 
	valid_until DATETIME NOT NULL, 
	is_revoked VARCHAR(10) NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(visitor_id) REFERENCES visitors (id)
);
INSERT INTO visitor_passes VALUES('4779f886-4e56-44bb-97e4-55da06b0bd9b','d0971b75-ec9d-4615-97a6-afe3c42ef0a0','VP-9A73661F','2026-10-29 14:00:00.000000','2026-10-29 17:00:00.000000','FALSE','2026-10-29 08:55:39.687035');
CREATE TABLE visitor_events (
	id VARCHAR NOT NULL, 
	visitor_id VARCHAR NOT NULL, 
	event_type VARCHAR(50) NOT NULL, 
	actor_id VARCHAR(100) NOT NULL, 
	actor_role VARCHAR(50) NOT NULL, 
	timestamp DATETIME NOT NULL, 
	details TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(visitor_id) REFERENCES visitors (id)
);
INSERT INTO visitor_events VALUES('660520fc-46ba-438b-872e-72fdcf344900','d0971b75-ec9d-4615-97a6-afe3c42ef0a0','REGISTERED','admin','security','2026-10-29 08:55:39.684818','Visitor registered for Alex Johnson. Policy auto_approved=True');
CREATE TABLE assets (
	id VARCHAR NOT NULL, 
	asset_tag VARCHAR(50) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	category VARCHAR(18) NOT NULL, 
	description TEXT, 
	serial_number VARCHAR(100), 
	building VARCHAR(50) NOT NULL, 
	block VARCHAR(50) NOT NULL, 
	floor INTEGER NOT NULL, 
	room_number VARCHAR(50), 
	bed_number VARCHAR(20), 
	purchase_date DATETIME, 
	purchase_cost FLOAT NOT NULL, 
	warranty_expiry DATETIME, 
	condition VARCHAR(12) NOT NULL, 
	status VARCHAR(12) NOT NULL, 
	notes TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE consumable_items (
	id VARCHAR NOT NULL, 
	item_code VARCHAR(50) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	category VARCHAR(50), 
	unit VARCHAR(20), 
	current_stock INTEGER NOT NULL, 
	min_threshold INTEGER NOT NULL, 
	supplier_name VARCHAR(100), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (item_code)
);
CREATE TABLE asset_movements (
	id VARCHAR NOT NULL, 
	asset_id VARCHAR NOT NULL, 
	from_location VARCHAR(100) NOT NULL, 
	to_location VARCHAR(100) NOT NULL, 
	actor_id VARCHAR(100) NOT NULL, 
	reason VARCHAR(255), 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(asset_id) REFERENCES assets (id)
);
CREATE TABLE asset_damage_reports (
	id VARCHAR NOT NULL, 
	asset_id VARCHAR NOT NULL, 
	reported_by VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	priority VARCHAR(20) NOT NULL, 
	maintenance_ticket_id VARCHAR(100), 
	repair_cost FLOAT, 
	resolution_status VARCHAR(50) NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(asset_id) REFERENCES assets (id)
);
CREATE TABLE inventory_transactions (
	id VARCHAR NOT NULL, 
	item_id VARCHAR NOT NULL, 
	transaction_type VARCHAR(20) NOT NULL, 
	quantity INTEGER NOT NULL, 
	actor_id VARCHAR(100) NOT NULL, 
	reference VARCHAR(255), 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(item_id) REFERENCES consumable_items (id)
);
CREATE TABLE parcels (
	id VARCHAR NOT NULL, 
	parcel_ref VARCHAR(50) NOT NULL, 
	recipient_student_id VARCHAR(50) NOT NULL, 
	recipient_name VARCHAR(100) NOT NULL, 
	recipient_room VARCHAR(50), 
	recipient_block VARCHAR(50), 
	courier VARCHAR(100) NOT NULL, 
	tracking_number VARCHAR(100), 
	storage_location VARCHAR(50) NOT NULL, 
	locker_number VARCHAR(20), 
	received_by VARCHAR(100) NOT NULL, 
	status VARCHAR(19) NOT NULL, 
	notes TEXT, 
	collected_at DATETIME, 
	handed_over_by VARCHAR(100), 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO parcels VALUES('1290a1a1-2a7f-434c-893b-2615158d89f1','PCL-2026-2121','STU101','Alex Johnson','204','Block A','Flipkart Express','','Locker 12','12','Staff Desk','COLLECTED','','2026-10-29 05:00:08.151875','Reception Officer (STF-RECEPT-1)','2026-10-28 16:47:42.602724','2026-10-29 05:00:08.153958');
CREATE TABLE parcel_pickup_codes (
	id VARCHAR NOT NULL, 
	parcel_id VARCHAR NOT NULL, 
	code VARCHAR(32) NOT NULL, 
	valid_until DATETIME NOT NULL, 
	used VARCHAR(10) NOT NULL, 
	attempts INTEGER NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parcel_id) REFERENCES parcels (id)
);
INSERT INTO parcel_pickup_codes VALUES('d1cc0289-1c1b-44a9-8b6a-ab440123dfe2','1290a1a1-2a7f-434c-893b-2615158d89f1','860419','2026-10-30 16:47:42.604063','TRUE',0,'2026-10-28 16:47:42.605690');
CREATE TABLE parcel_events (
	id VARCHAR NOT NULL, 
	parcel_id VARCHAR NOT NULL, 
	event_type VARCHAR(50) NOT NULL, 
	actor_id VARCHAR(100) NOT NULL, 
	actor_role VARCHAR(50) NOT NULL, 
	timestamp DATETIME, 
	details TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parcel_id) REFERENCES parcels (id)
);
INSERT INTO parcel_events VALUES('de2cf250-c6f9-4091-8b51-765a62ec8257','1290a1a1-2a7f-434c-893b-2615158d89f1','REGISTERED','Staff Desk','staff','2026-10-28 16:47:42.604984','Parcel received via Flipkart Express and stored at Locker 12. Secret OTP issued.');
INSERT INTO parcel_events VALUES('b5a967b5-e3b4-420e-beb7-28ec6b7b43c9','1290a1a1-2a7f-434c-893b-2615158d89f1','COLLECTED','STF-RECEPT-1','staff','2026-10-29 05:00:08.155368','Secure OTP verified. Handed over to recipient Alex Johnson.');
CREATE TABLE laundry_rates (
	id VARCHAR NOT NULL, 
	item_category VARCHAR(50) NOT NULL, 
	service_type VARCHAR(13) NOT NULL, 
	rate_per_piece FLOAT NOT NULL, 
	is_active VARCHAR(10) NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO laundry_rates VALUES('b61b9080-e84f-4fae-9545-f8acc41da9fe','SHIRT','WASH_AND_IRON',20.0,'TRUE','2026-10-28 16:45:34.861702');
INSERT INTO laundry_rates VALUES('cf1d8fc8-f02d-4447-88f2-ee258ff8bd12','TROUSER','WASH_AND_IRON',18.0,'TRUE','2026-10-28 16:45:34.861859');
INSERT INTO laundry_rates VALUES('fcf57475-b14e-4abf-a4d3-08eca117d3e3','BEDSHEET','WASH_AND_IRON',35.0,'TRUE','2026-10-28 16:45:34.861866');
INSERT INTO laundry_rates VALUES('d9cfcc38-942b-44ab-af98-4f9059b89c47','TOWEL','WASH_AND_IRON',12.0,'TRUE','2026-10-28 16:45:34.861872');
INSERT INTO laundry_rates VALUES('2d3604a3-9993-4f8a-afdb-9d2098a0df0b','JACKET','WASH_AND_IRON',45.0,'TRUE','2026-10-28 16:45:34.861877');
INSERT INTO laundry_rates VALUES('a3234a7a-d0e4-42a3-b75e-b5b42389b1fa','OTHER','WASH_AND_IRON',20.0,'TRUE','2026-10-28 16:45:34.861884');
CREATE TABLE laundry_slots (
	id VARCHAR NOT NULL, 
	slot_date VARCHAR(20) NOT NULL, 
	time_window VARCHAR(50) NOT NULL, 
	max_capacity INTEGER NOT NULL, 
	booked_count INTEGER NOT NULL, 
	is_open VARCHAR(10) NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO laundry_slots VALUES('b6d80d81-1c43-4920-982a-0cad79d3d91a','2026-10-29','05:00 - 07:00 PM',15,1,'TRUE');
CREATE TABLE laundry_orders (
	id VARCHAR NOT NULL, 
	order_ref VARCHAR(50) NOT NULL, 
	student_id VARCHAR(50) NOT NULL, 
	student_name VARCHAR(100) NOT NULL, 
	room_number VARCHAR(50), 
	block_name VARCHAR(50), 
	service_type VARCHAR(13) NOT NULL, 
	slot_id VARCHAR, 
	pickup_date VARCHAR(20) NOT NULL, 
	pickup_time_slot VARCHAR(50) NOT NULL, 
	special_instructions TEXT, 
	submitted_item_count INTEGER NOT NULL, 
	confirmed_item_count INTEGER, 
	count_mismatch_noted VARCHAR(10) NOT NULL, 
	estimated_amount FLOAT NOT NULL, 
	final_amount FLOAT NOT NULL, 
	billing_status VARCHAR(50) NOT NULL, 
	fee_transaction_id VARCHAR(100), 
	status VARCHAR(20) NOT NULL, 
	status_notes TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(slot_id) REFERENCES laundry_slots (id)
);
INSERT INTO laundry_orders VALUES('c83a4ab6-15e0-4bfa-9676-3abb5341b42c','LND-2026-4453','STU101','Alex Johnson','204','Block A','WASH_AND_IRON','b6d80d81-1c43-4920-982a-0cad79d3d91a','2026-10-29','05:00 - 07:00 PM','',9,9,'FALSE',205.0,205.0,'BILLED_TO_FEES','FEE-LND-002365','DELIVERED','Handed over clean clothing to student at counter','2026-10-28 16:46:59.344898','2026-10-28 16:47:13.629918');
CREATE TABLE laundry_order_items (
	id VARCHAR NOT NULL, 
	order_id VARCHAR NOT NULL, 
	item_category VARCHAR(50) NOT NULL, 
	quantity_submitted INTEGER NOT NULL, 
	quantity_confirmed INTEGER, 
	unit_rate FLOAT NOT NULL, 
	total_price FLOAT NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES laundry_orders (id)
);
INSERT INTO laundry_order_items VALUES('81460924-f3fa-4856-97a5-abdc0775f81f','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','SHIRT',2,2,15.0,30.0);
INSERT INTO laundry_order_items VALUES('ebae4bd0-112a-4712-87d7-97993885faa7','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','TROUSER',2,2,18.0,36.0);
INSERT INTO laundry_order_items VALUES('4295454e-71c3-4495-9a2b-8adbefbb5504','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','BEDSHEET',2,2,35.0,70.0);
INSERT INTO laundry_order_items VALUES('b34c4e3a-9dd5-49fb-9718-7cb2d3273d02','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','TOWEL',2,2,12.0,24.0);
INSERT INTO laundry_order_items VALUES('20d6b826-ca8f-4e2d-9f5d-fe9d8e0d7afd','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','JACKET',1,1,45.0,45.0);
CREATE TABLE laundry_status_events (
	id VARCHAR NOT NULL, 
	order_id VARCHAR NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	actor_id VARCHAR(100) NOT NULL, 
	actor_role VARCHAR(50) NOT NULL, 
	timestamp DATETIME, 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES laundry_orders (id)
);
INSERT INTO laundry_status_events VALUES('58ae00e6-b04e-44a0-8407-46690080f005','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','REQUESTED','STU101','student','2026-10-28 16:46:59.349821','Order booked for 9 items. Est charge: ₹205.0.');
INSERT INTO laundry_status_events VALUES('20e267b3-f92a-4ba8-95f4-aee17dd20b07','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','COLLECTED','LND-TECH-1','staff','2026-10-28 16:47:09.961186','Intake verification by Laundry Operator. Confirmed 9 items (Mismatch noted: False). Adjusted final: ₹205.0.');
INSERT INTO laundry_status_events VALUES('f69468b5-62d6-4c21-8a4e-3960efd7dd77','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','PROCESSING','LND-TECH-1','staff','2026-10-28 16:47:11.235268','Status advanced to PROCESSING by Laundry Operator. Loaded into industrial washing machine #2');
INSERT INTO laundry_status_events VALUES('20205914-515a-4a99-b275-14978d9359cb','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','READY_FOR_COLLECTION','LND-TECH-1','staff','2026-10-28 16:47:12.197011','Status advanced to READY_FOR_COLLECTION by Laundry Operator. Steam-ironed and packaged for resident pickup');
INSERT INTO laundry_status_events VALUES('4c6b53c7-53dd-4a9d-87ab-700b2f5eb656','c83a4ab6-15e0-4bfa-9676-3abb5341b42c','DELIVERED','LND-TECH-1','staff','2026-10-28 16:47:13.630400','Status advanced to DELIVERED by Laundry Operator. Handed over clean clothing to student at counter');
CREATE TABLE inspection_templates (
	id VARCHAR NOT NULL, 
	title VARCHAR(100) NOT NULL, 
	description TEXT, 
	is_active VARCHAR(10) NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE inspection_template_items (
	id VARCHAR NOT NULL, 
	template_id VARCHAR NOT NULL, 
	criterion_name VARCHAR(100) NOT NULL, 
	category VARCHAR(50) NOT NULL, 
	weight INTEGER NOT NULL, 
	severity VARCHAR(8) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(template_id) REFERENCES inspection_templates (id)
);
CREATE TABLE inspections (
	id VARCHAR NOT NULL, 
	inspection_ref VARCHAR(50) NOT NULL, 
	template_id VARCHAR NOT NULL, 
	building VARCHAR(50) NOT NULL, 
	block VARCHAR(50) NOT NULL, 
	floor INTEGER NOT NULL, 
	room_number VARCHAR(50) NOT NULL, 
	inspector_id VARCHAR(100) NOT NULL, 
	inspector_name VARCHAR(100) NOT NULL, 
	scheduled_date VARCHAR(20) NOT NULL, 
	completed_at DATETIME, 
	cleanliness_score FLOAT, 
	overall_result VARCHAR(20) NOT NULL, 
	status VARCHAR(18) NOT NULL, 
	general_notes TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(template_id) REFERENCES inspection_templates (id)
);
CREATE TABLE inspection_results (
	id VARCHAR NOT NULL, 
	inspection_id VARCHAR NOT NULL, 
	criterion_name VARCHAR(100) NOT NULL, 
	category VARCHAR(50) NOT NULL, 
	result VARCHAR(15) NOT NULL, 
	notes TEXT, 
	flagged_issue VARCHAR(10) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(inspection_id) REFERENCES inspections (id)
);
CREATE TABLE corrective_actions (
	id VARCHAR NOT NULL, 
	inspection_id VARCHAR NOT NULL, 
	criterion_name VARCHAR(100) NOT NULL, 
	action_type VARCHAR(50) NOT NULL, 
	assignee VARCHAR(100) NOT NULL, 
	priority VARCHAR(20) NOT NULL, 
	linked_maintenance_ticket_id VARCHAR(100), 
	status VARCHAR(50) NOT NULL, 
	resolution_notes TEXT, 
	created_at DATETIME, 
	resolved_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(inspection_id) REFERENCES inspections (id)
);
CREATE TABLE blocks (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	code VARCHAR, 
	floors_count INTEGER, 
	rooms_count INTEGER, 
	capacity INTEGER, 
	occupied INTEGER, 
	warden_name VARCHAR, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO blocks VALUES('blk-a','Block A (Newton)','BLK-A',5,30,120,120,'Prof. Rajesh K. Sharma','2026-11-02 16:45:01.145821');
CREATE TABLE profiles (
	id VARCHAR NOT NULL, 
	full_name VARCHAR NOT NULL, 
	email VARCHAR, 
	phone VARCHAR, 
	role VARCHAR, 
	avatar_url VARCHAR, 
	room_number VARCHAR, 
	block_name VARCHAR, 
	bed_number VARCHAR, 
	roll_no VARCHAR, 
	course VARCHAR, 
	year INTEGER, 
	guardian_name VARCHAR, 
	guardian_phone VARCHAR, 
	fee_status VARCHAR, 
	fee_amount_due NUMERIC, 
	attendance_percent NUMERIC, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (email)
);
INSERT INTO profiles VALUES('usr-admin-1','Sarah Jenkins','sarah.jenkins@hostelos.edu','+91 98765 43210','admin','https://api.dicebear.com/9.x/initials/svg?seed=Sarah%20Jenkins&backgroundColor=0284c7&textColor=ffffff',NULL,NULL,NULL,NULL,'Chief Administrator',1,NULL,NULL,'paid',0,95,'2026-11-02 16:45:01.146531');
INSERT INTO profiles VALUES('usr-warden-1','Prof. Rajesh K. Sharma','rajesh.sharma@hostelos.edu','+91 98111 22334','warden','https://api.dicebear.com/9.x/initials/svg?seed=Rajesh%20Sharma&backgroundColor=0284c7&textColor=ffffff',NULL,NULL,NULL,NULL,'Senior Resident Warden',1,NULL,NULL,'paid',0,95,'2026-11-02 16:45:01.146533');
INSERT INTO profiles VALUES('usr-student-1','Aarav Patel','aarav.sharma@hostelos.edu','+91 98201 10000','student','https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Sharma&backgroundColor=0284c7&textColor=ffffff','A-101','Block A (Newton)','Bed 1','21BCS001','B.Tech CSE',1,'Sharma Senior','+91 98200 20000','paid',0,85,'2026-11-02 17:37:36.671527');
INSERT INTO profiles VALUES('std-2','Rohan Verma','rohan.verma@hostelos.edu','+91 98201 10001','student','https://api.dicebear.com/9.x/initials/svg?seed=Rohan%20Verma&backgroundColor=0284c7&textColor=ffffff','A-101','Block A (Newton)','Bed 2','21BCS002','B.Tech ECE',2,'Verma Senior','+91 98200 20001','paid',0,86,'2026-11-02 17:37:36.671530');
INSERT INTO profiles VALUES('std-3','Aditya Mishra','aditya.mishra@hostelos.edu','+91 98201 10002','student','https://api.dicebear.com/9.x/initials/svg?seed=Aditya%20Mishra&backgroundColor=0284c7&textColor=ffffff','A-101','Block A (Newton)','Bed 3','21BCS003','B.Tech ME',3,'Mishra Senior','+91 98200 20002','pending',4500,87,'2026-11-02 17:37:36.671530');
INSERT INTO profiles VALUES('std-4','Vivaan Tiwari','vivaan.tiwari@hostelos.edu','+91 98201 10003','student','https://api.dicebear.com/9.x/initials/svg?seed=Vivaan%20Tiwari&backgroundColor=0284c7&textColor=ffffff','A-101','Block A (Newton)','Bed 4','21BCS004','B.Tech CE',4,'Tiwari Senior','+91 98200 20003','partial',2250,88,'2026-11-02 17:37:36.671531');
INSERT INTO profiles VALUES('std-5','Harsh Chauhan','harsh.chauhan@hostelos.edu','+91 98201 10004','student','https://api.dicebear.com/9.x/initials/svg?seed=Harsh%20Chauhan&backgroundColor=0284c7&textColor=ffffff','A-102','Block A (Newton)','Bed 1','21BCS005','B.Tech IT',1,'Chauhan Senior','+91 98200 20004','paid',0,89,'2026-11-02 17:37:36.671531');
INSERT INTO profiles VALUES('std-6','Kabir Bhatia','kabir.bhatia@hostelos.edu','+91 98201 10005','student','https://api.dicebear.com/9.x/initials/svg?seed=Kabir%20Bhatia&backgroundColor=0284c7&textColor=ffffff','A-102','Block A (Newton)','Bed 2','21BCS006','B.Tech CSE',2,'Bhatia Senior','+91 98200 20005','paid',0,90,'2026-11-02 17:37:36.671532');
INSERT INTO profiles VALUES('std-7','Ayush Saxena','ayush.saxena@hostelos.edu','+91 98201 10006','student','https://api.dicebear.com/9.x/initials/svg?seed=Ayush%20Saxena&backgroundColor=0284c7&textColor=ffffff','A-102','Block A (Newton)','Bed 3','21BCS007','B.Tech ECE',3,'Saxena Senior','+91 98200 20006','paid',0,91,'2026-11-02 17:37:36.671532');
INSERT INTO profiles VALUES('std-8','Kunal Kapoor','kunal.kapoor@hostelos.edu','+91 98201 10007','student','https://api.dicebear.com/9.x/initials/svg?seed=Kunal%20Kapoor&backgroundColor=0284c7&textColor=ffffff','A-102','Block A (Newton)','Bed 4','21BCS008','B.Tech ME',4,'Kapoor Senior','+91 98200 20007','pending',4500,92,'2026-11-02 17:37:36.671533');
INSERT INTO profiles VALUES('std-9','Mohit Gupta','mohit.gupta@hostelos.edu','+91 98201 10008','student','https://api.dicebear.com/9.x/initials/svg?seed=Mohit%20Gupta&backgroundColor=0284c7&textColor=ffffff','A-103','Block A (Newton)','Bed 1','21BCS009','B.Tech CE',1,'Gupta Senior','+91 98200 20008','partial',2250,93,'2026-11-02 17:37:36.671533');
INSERT INTO profiles VALUES('std-10','Rahul Malhotra','rahul.malhotra@hostelos.edu','+91 98201 10009','student','https://api.dicebear.com/9.x/initials/svg?seed=Rahul%20Malhotra&backgroundColor=0284c7&textColor=ffffff','A-103','Block A (Newton)','Bed 2','21BCS010','B.Tech IT',2,'Malhotra Senior','+91 98200 20009','paid',0,94,'2026-11-02 17:37:36.671534');
INSERT INTO profiles VALUES('std-11','Deepak Pandey','deepak.pandey@hostelos.edu','+91 98201 10010','student','https://api.dicebear.com/9.x/initials/svg?seed=Deepak%20Pandey&backgroundColor=0284c7&textColor=ffffff','A-103','Block A (Newton)','Bed 3','21BCS011','B.Tech CSE',3,'Pandey Senior','+91 98200 20010','paid',0,95,'2026-11-02 17:37:36.671534');
INSERT INTO profiles VALUES('std-12','Sanjay Shukla','sanjay.shukla@hostelos.edu','+91 98201 10011','student','https://api.dicebear.com/9.x/initials/svg?seed=Sanjay%20Shukla&backgroundColor=0284c7&textColor=ffffff','A-103','Block A (Newton)','Bed 4','21BCS012','B.Tech ECE',4,'Shukla Senior','+91 98200 20011','paid',0,96,'2026-11-02 17:37:36.671535');
INSERT INTO profiles VALUES('std-13','Alok Yadav','alok.yadav@hostelos.edu','+91 98201 10012','student','https://api.dicebear.com/9.x/initials/svg?seed=Alok%20Yadav&backgroundColor=0284c7&textColor=ffffff','A-104','Block A (Newton)','Bed 1','21BCS013','B.Tech ME',1,'Yadav Senior','+91 98200 20012','pending',4500,97,'2026-11-02 17:37:36.671535');
INSERT INTO profiles VALUES('std-14','Rajeev Singh','rajeev.singh@hostelos.edu','+91 98201 10013','student','https://api.dicebear.com/9.x/initials/svg?seed=Rajeev%20Singh&backgroundColor=0284c7&textColor=ffffff','A-104','Block A (Newton)','Bed 2','21BCS014','B.Tech CE',2,'Singh Senior','+91 98200 20013','partial',2250,98,'2026-11-02 17:37:36.671536');
INSERT INTO profiles VALUES('std-15','Naveen Rathore','naveen.rathore@hostelos.edu','+91 98201 10014','student','https://api.dicebear.com/9.x/initials/svg?seed=Naveen%20Rathore&backgroundColor=0284c7&textColor=ffffff','A-104','Block A (Newton)','Bed 3','21BCS015','B.Tech IT',3,'Rathore Senior','+91 98200 20014','paid',0,85,'2026-11-02 17:37:36.671536');
INSERT INTO profiles VALUES('std-16','Vikas Nair','vikas.nair@hostelos.edu','+91 98201 10015','student','https://api.dicebear.com/9.x/initials/svg?seed=Vikas%20Nair&backgroundColor=0284c7&textColor=ffffff','A-104','Block A (Newton)','Bed 4','21BCS016','B.Tech CSE',4,'Nair Senior','+91 98200 20015','paid',0,86,'2026-11-02 17:37:36.671536');
INSERT INTO profiles VALUES('std-17','Abhishek Subramanian','abhishek.subramanian@hostelos.edu','+91 98201 10016','student','https://api.dicebear.com/9.x/initials/svg?seed=Abhishek%20Subramanian&backgroundColor=0284c7&textColor=ffffff','A-105','Block A (Newton)','Bed 1','21BCS017','B.Tech ECE',1,'Subramanian Senior','+91 98200 20016','paid',0,87,'2026-11-02 17:37:36.671537');
INSERT INTO profiles VALUES('std-18','Gautam Iyer','gautam.iyer@hostelos.edu','+91 98201 10017','student','https://api.dicebear.com/9.x/initials/svg?seed=Gautam%20Iyer&backgroundColor=0284c7&textColor=ffffff','A-105','Block A (Newton)','Bed 2','21BCS018','B.Tech ME',2,'Iyer Senior','+91 98200 20017','pending',4500,88,'2026-11-02 17:37:36.671537');
INSERT INTO profiles VALUES('std-19','Neeraj Murthy','neeraj.murthy@hostelos.edu','+91 98201 10018','student','https://api.dicebear.com/9.x/initials/svg?seed=Neeraj%20Murthy&backgroundColor=0284c7&textColor=ffffff','A-105','Block A (Newton)','Bed 3','21BCS019','B.Tech CE',3,'Murthy Senior','+91 98200 20018','partial',2250,89,'2026-11-02 17:37:36.671538');
INSERT INTO profiles VALUES('std-20','Tarun Reddy','tarun.reddy@hostelos.edu','+91 98201 10019','student','https://api.dicebear.com/9.x/initials/svg?seed=Tarun%20Reddy&backgroundColor=0284c7&textColor=ffffff','A-105','Block A (Newton)','Bed 4','21BCS020','B.Tech IT',4,'Reddy Senior','+91 98200 20019','paid',0,90,'2026-11-02 17:37:36.671538');
INSERT INTO profiles VALUES('std-21','Ankit Menon','ankit.menon@hostelos.edu','+91 98201 10020','student','https://api.dicebear.com/9.x/initials/svg?seed=Ankit%20Menon&backgroundColor=0284c7&textColor=ffffff','A-106','Block A (Newton)','Bed 1','21BCS021','B.Tech CSE',1,'Menon Senior','+91 98200 20020','paid',0,91,'2026-11-02 17:37:36.671539');
INSERT INTO profiles VALUES('std-22','Sourabh Venkatesh','sourabh.venkatesh@hostelos.edu','+91 98201 10021','student','https://api.dicebear.com/9.x/initials/svg?seed=Sourabh%20Venkatesh&backgroundColor=0284c7&textColor=ffffff','A-106','Block A (Newton)','Bed 2','21BCS022','B.Tech ECE',2,'Venkatesh Senior','+91 98200 20021','paid',0,92,'2026-11-02 17:37:36.671539');
INSERT INTO profiles VALUES('std-23','Mayank Swaminathan','mayank.swaminathan@hostelos.edu','+91 98201 10022','student','https://api.dicebear.com/9.x/initials/svg?seed=Mayank%20Swaminathan&backgroundColor=0284c7&textColor=ffffff','A-106','Block A (Newton)','Bed 3','21BCS023','B.Tech ME',3,'Swaminathan Senior','+91 98200 20022','pending',4500,93,'2026-11-02 17:37:36.671540');
INSERT INTO profiles VALUES('std-24','Harshit Pillai','harshit.pillai@hostelos.edu','+91 98201 10023','student','https://api.dicebear.com/9.x/initials/svg?seed=Harshit%20Pillai&backgroundColor=0284c7&textColor=ffffff','A-106','Block A (Newton)','Bed 4','21BCS024','B.Tech CE',4,'Pillai Senior','+91 98200 20023','partial',2250,94,'2026-11-02 17:37:36.671540');
INSERT INTO profiles VALUES('std-25','Utkarsh Rao','utkarsh.rao@hostelos.edu','+91 98201 10024','student','https://api.dicebear.com/9.x/initials/svg?seed=Utkarsh%20Rao&backgroundColor=0284c7&textColor=ffffff','A-201','Block A (Newton)','Bed 1','21BCS025','B.Tech IT',1,'Rao Senior','+91 98200 20024','paid',0,95,'2026-11-02 17:37:36.671540');
INSERT INTO profiles VALUES('std-26','Kartik Nambiar','kartik.nambiar@hostelos.edu','+91 98201 10025','student','https://api.dicebear.com/9.x/initials/svg?seed=Kartik%20Nambiar&backgroundColor=0284c7&textColor=ffffff','A-201','Block A (Newton)','Bed 2','21BCS026','B.Tech CSE',2,'Nambiar Senior','+91 98200 20025','paid',0,96,'2026-11-02 17:37:36.671541');
INSERT INTO profiles VALUES('std-27','Lokesh Balaji','lokesh.balaji@hostelos.edu','+91 98201 10026','student','https://api.dicebear.com/9.x/initials/svg?seed=Lokesh%20Balaji&backgroundColor=0284c7&textColor=ffffff','A-201','Block A (Newton)','Bed 3','21BCS027','B.Tech ECE',3,'Balaji Senior','+91 98200 20026','paid',0,97,'2026-11-02 17:37:36.671541');
INSERT INTO profiles VALUES('std-28','Raghav Krishnan','raghav.krishnan@hostelos.edu','+91 98201 10027','student','https://api.dicebear.com/9.x/initials/svg?seed=Raghav%20Krishnan&backgroundColor=0284c7&textColor=ffffff','A-201','Block A (Newton)','Bed 4','21BCS028','B.Tech ME',4,'Krishnan Senior','+91 98200 20027','pending',4500,98,'2026-11-02 17:37:36.671542');
INSERT INTO profiles VALUES('std-29','Shubham Naidu','shubham.naidu@hostelos.edu','+91 98201 10028','student','https://api.dicebear.com/9.x/initials/svg?seed=Shubham%20Naidu&backgroundColor=0284c7&textColor=ffffff','A-202','Block A (Newton)','Bed 1','21BCS029','B.Tech CE',1,'Naidu Senior','+91 98200 20028','partial',2250,85,'2026-11-02 17:37:36.671542');
INSERT INTO profiles VALUES('std-30','Uday Shetty','uday.shetty@hostelos.edu','+91 98201 10029','student','https://api.dicebear.com/9.x/initials/svg?seed=Uday%20Shetty&backgroundColor=0284c7&textColor=ffffff','A-202','Block A (Newton)','Bed 2','21BCS030','B.Tech IT',2,'Shetty Senior','+91 98200 20029','paid',0,86,'2026-11-02 17:37:36.671543');
INSERT INTO profiles VALUES('std-31','Siddharth Banerjee','siddharth.banerjee@hostelos.edu','+91 98201 10030','student','https://api.dicebear.com/9.x/initials/svg?seed=Siddharth%20Banerjee&backgroundColor=0284c7&textColor=ffffff','A-202','Block A (Newton)','Bed 3','21BCS031','B.Tech CSE',3,'Banerjee Senior','+91 98200 20030','paid',0,87,'2026-11-02 17:37:36.671543');
INSERT INTO profiles VALUES('std-32','Vignesh Mukherjee','vignesh.mukherjee@hostelos.edu','+91 98201 10031','student','https://api.dicebear.com/9.x/initials/svg?seed=Vignesh%20Mukherjee&backgroundColor=0284c7&textColor=ffffff','A-202','Block A (Newton)','Bed 4','21BCS032','B.Tech ECE',4,'Mukherjee Senior','+91 98200 20031','paid',0,88,'2026-11-02 17:37:36.671544');
INSERT INTO profiles VALUES('std-33','Karthik Chatterjee','karthik.chatterjee@hostelos.edu','+91 98201 10032','student','https://api.dicebear.com/9.x/initials/svg?seed=Karthik%20Chatterjee&backgroundColor=0284c7&textColor=ffffff','A-203','Block A (Newton)','Bed 1','21BCS033','B.Tech ME',1,'Chatterjee Senior','+91 98200 20032','pending',4500,89,'2026-11-02 17:37:36.671544');
INSERT INTO profiles VALUES('std-34','Pranav Roy','pranav.roy@hostelos.edu','+91 98201 10033','student','https://api.dicebear.com/9.x/initials/svg?seed=Pranav%20Roy&backgroundColor=0284c7&textColor=ffffff','A-203','Block A (Newton)','Bed 2','21BCS034','B.Tech CE',2,'Roy Senior','+91 98200 20033','partial',2250,90,'2026-11-02 17:37:36.671544');
INSERT INTO profiles VALUES('std-35','Sai Sengupta','sai.sengupta@hostelos.edu','+91 98201 10034','student','https://api.dicebear.com/9.x/initials/svg?seed=Sai%20Sengupta&backgroundColor=0284c7&textColor=ffffff','A-203','Block A (Newton)','Bed 3','21BCS035','B.Tech IT',3,'Sengupta Senior','+91 98200 20034','paid',0,91,'2026-11-02 17:37:36.671545');
INSERT INTO profiles VALUES('std-36','Ashwin Das','ashwin.das@hostelos.edu','+91 98201 10035','student','https://api.dicebear.com/9.x/initials/svg?seed=Ashwin%20Das&backgroundColor=0284c7&textColor=ffffff','A-203','Block A (Newton)','Bed 4','21BCS036','B.Tech CSE',4,'Das Senior','+91 98200 20035','paid',0,92,'2026-11-02 17:37:36.671545');
INSERT INTO profiles VALUES('std-37','Balakrishnan Dutta','balakrishnan.dutta@hostelos.edu','+91 98201 10036','student','https://api.dicebear.com/9.x/initials/svg?seed=Balakrishnan%20Dutta&backgroundColor=0284c7&textColor=ffffff','A-204','Block A (Newton)','Bed 1','21BCS037','B.Tech ECE',1,'Dutta Senior','+91 98200 20036','paid',0,93,'2026-11-02 17:37:36.671546');
INSERT INTO profiles VALUES('std-38','Dhanush Ghosh','dhanush.ghosh@hostelos.edu','+91 98201 10037','student','https://api.dicebear.com/9.x/initials/svg?seed=Dhanush%20Ghosh&backgroundColor=0284c7&textColor=ffffff','A-204','Block A (Newton)','Bed 2','21BCS038','B.Tech ME',2,'Ghosh Senior','+91 98200 20037','pending',4500,94,'2026-11-02 17:37:36.671546');
INSERT INTO profiles VALUES('std-39','Arvind Bhattacharya','arvind.bhattacharya@hostelos.edu','+91 98201 10038','student','https://api.dicebear.com/9.x/initials/svg?seed=Arvind%20Bhattacharya&backgroundColor=0284c7&textColor=ffffff','A-204','Block A (Newton)','Bed 3','21BCS039','B.Tech CE',3,'Bhattacharya Senior','+91 98200 20038','partial',2250,95,'2026-11-02 17:37:36.671547');
INSERT INTO profiles VALUES('std-40','Surya Bose','surya.bose@hostelos.edu','+91 98201 10039','student','https://api.dicebear.com/9.x/initials/svg?seed=Surya%20Bose&backgroundColor=0284c7&textColor=ffffff','A-204','Block A (Newton)','Bed 4','21BCS040','B.Tech IT',4,'Bose Senior','+91 98200 20039','paid',0,96,'2026-11-02 17:37:36.671547');
INSERT INTO profiles VALUES('std-41','Manoj Majumdar','manoj.majumdar@hostelos.edu','+91 98201 10040','student','https://api.dicebear.com/9.x/initials/svg?seed=Manoj%20Majumdar&backgroundColor=0284c7&textColor=ffffff','A-205','Block A (Newton)','Bed 1','21BCS041','B.Tech CSE',1,'Majumdar Senior','+91 98200 20040','paid',0,97,'2026-11-02 17:37:36.671548');
INSERT INTO profiles VALUES('std-42','Praveen Chakraborty','praveen.chakraborty@hostelos.edu','+91 98201 10041','student','https://api.dicebear.com/9.x/initials/svg?seed=Praveen%20Chakraborty&backgroundColor=0284c7&textColor=ffffff','A-205','Block A (Newton)','Bed 2','21BCS042','B.Tech ECE',2,'Chakraborty Senior','+91 98200 20041','paid',0,98,'2026-11-02 17:37:36.671548');
INSERT INTO profiles VALUES('std-43','Suresh Ganguly','suresh.ganguly@hostelos.edu','+91 98201 10042','student','https://api.dicebear.com/9.x/initials/svg?seed=Suresh%20Ganguly&backgroundColor=0284c7&textColor=ffffff','A-205','Block A (Newton)','Bed 3','21BCS043','B.Tech ME',3,'Ganguly Senior','+91 98200 20042','pending',4500,85,'2026-11-02 17:37:36.671548');
INSERT INTO profiles VALUES('std-44','Ramesh Mitra','ramesh.mitra@hostelos.edu','+91 98201 10043','student','https://api.dicebear.com/9.x/initials/svg?seed=Ramesh%20Mitra&backgroundColor=0284c7&textColor=ffffff','A-205','Block A (Newton)','Bed 4','21BCS044','B.Tech CE',4,'Mitra Senior','+91 98200 20043','partial',2250,86,'2026-11-02 17:37:36.671549');
INSERT INTO profiles VALUES('std-45','Ganesh Saha','ganesh.saha@hostelos.edu','+91 98201 10044','student','https://api.dicebear.com/9.x/initials/svg?seed=Ganesh%20Saha&backgroundColor=0284c7&textColor=ffffff','A-206','Block A (Newton)','Bed 1','21BCS045','B.Tech IT',1,'Saha Senior','+91 98200 20044','paid',0,87,'2026-11-02 17:37:36.671549');
INSERT INTO profiles VALUES('std-46','Venkat Patel','venkat.patel@hostelos.edu','+91 98201 10045','student','https://api.dicebear.com/9.x/initials/svg?seed=Venkat%20Patel&backgroundColor=0284c7&textColor=ffffff','A-206','Block A (Newton)','Bed 2','21BCS046','B.Tech CSE',2,'Patel Senior','+91 98200 20045','paid',0,88,'2026-11-02 17:37:36.671550');
INSERT INTO profiles VALUES('std-47','Hari Dixit','hari.dixit@hostelos.edu','+91 98201 10046','student','https://api.dicebear.com/9.x/initials/svg?seed=Hari%20Dixit&backgroundColor=0284c7&textColor=ffffff','A-206','Block A (Newton)','Bed 3','21BCS047','B.Tech ECE',3,'Dixit Senior','+91 98200 20046','paid',0,89,'2026-11-02 17:37:36.671550');
INSERT INTO profiles VALUES('std-48','Vijay Mehta','vijay.mehta@hostelos.edu','+91 98201 10047','student','https://api.dicebear.com/9.x/initials/svg?seed=Vijay%20Mehta&backgroundColor=0284c7&textColor=ffffff','A-206','Block A (Newton)','Bed 4','21BCS048','B.Tech ME',4,'Mehta Senior','+91 98200 20047','pending',4500,90,'2026-11-02 17:37:36.671551');
INSERT INTO profiles VALUES('std-49','Kishore Shah','kishore.shah@hostelos.edu','+91 98201 10048','student','https://api.dicebear.com/9.x/initials/svg?seed=Kishore%20Shah&backgroundColor=0284c7&textColor=ffffff','A-301','Block A (Newton)','Bed 1','21BCS049','B.Tech CE',1,'Shah Senior','+91 98200 20048','partial',2250,91,'2026-11-02 17:37:36.671551');
INSERT INTO profiles VALUES('std-50','Anand Kulkarni','anand.kulkarni@hostelos.edu','+91 98201 10049','student','https://api.dicebear.com/9.x/initials/svg?seed=Anand%20Kulkarni&backgroundColor=0284c7&textColor=ffffff','A-301','Block A (Newton)','Bed 2','21BCS050','B.Tech IT',2,'Kulkarni Senior','+91 98200 20049','paid',0,92,'2026-11-02 17:37:36.671551');
INSERT INTO profiles VALUES('std-51','Madhav Joshi','madhav.joshi@hostelos.edu','+91 98201 10050','student','https://api.dicebear.com/9.x/initials/svg?seed=Madhav%20Joshi&backgroundColor=0284c7&textColor=ffffff','A-301','Block A (Newton)','Bed 3','21BCS051','B.Tech CSE',3,'Joshi Senior','+91 98200 20050','paid',0,93,'2026-11-02 17:37:36.671552');
INSERT INTO profiles VALUES('std-52','Sriram Deshmukh','sriram.deshmukh@hostelos.edu','+91 98201 10051','student','https://api.dicebear.com/9.x/initials/svg?seed=Sriram%20Deshmukh&backgroundColor=0284c7&textColor=ffffff','A-301','Block A (Newton)','Bed 4','21BCS052','B.Tech ECE',4,'Deshmukh Senior','+91 98200 20051','paid',0,94,'2026-11-02 17:37:36.671553');
INSERT INTO profiles VALUES('std-53','Varun Marathe','varun.marathe@hostelos.edu','+91 98201 10052','student','https://api.dicebear.com/9.x/initials/svg?seed=Varun%20Marathe&backgroundColor=0284c7&textColor=ffffff','A-302','Block A (Newton)','Bed 1','21BCS053','B.Tech ME',1,'Marathe Senior','+91 98200 20052','pending',4500,95,'2026-11-02 17:37:36.671553');
INSERT INTO profiles VALUES('std-54','Nikhil Pawar','nikhil.pawar@hostelos.edu','+91 98201 10053','student','https://api.dicebear.com/9.x/initials/svg?seed=Nikhil%20Pawar&backgroundColor=0284c7&textColor=ffffff','A-302','Block A (Newton)','Bed 2','21BCS054','B.Tech CE',2,'Pawar Senior','+91 98200 20053','partial',2250,96,'2026-11-02 17:37:36.671554');
INSERT INTO profiles VALUES('std-55','Vishnu Shinde','vishnu.shinde@hostelos.edu','+91 98201 10054','student','https://api.dicebear.com/9.x/initials/svg?seed=Vishnu%20Shinde&backgroundColor=0284c7&textColor=ffffff','A-302','Block A (Newton)','Bed 3','21BCS055','B.Tech IT',3,'Shinde Senior','+91 98200 20054','paid',0,97,'2026-11-02 17:37:36.671554');
INSERT INTO profiles VALUES('std-56','Kalyan Patil','kalyan.patil@hostelos.edu','+91 98201 10055','student','https://api.dicebear.com/9.x/initials/svg?seed=Kalyan%20Patil&backgroundColor=0284c7&textColor=ffffff','A-302','Block A (Newton)','Bed 4','21BCS056','B.Tech CSE',4,'Patil Senior','+91 98200 20055','paid',0,98,'2026-11-02 17:37:36.671555');
INSERT INTO profiles VALUES('std-57','Girish Chavan','girish.chavan@hostelos.edu','+91 98201 10056','student','https://api.dicebear.com/9.x/initials/svg?seed=Girish%20Chavan&backgroundColor=0284c7&textColor=ffffff','A-303','Block A (Newton)','Bed 1','21BCS057','B.Tech ECE',1,'Chavan Senior','+91 98200 20056','paid',0,85,'2026-11-02 17:37:36.671555');
INSERT INTO profiles VALUES('std-58','Shankar Gaikwad','shankar.gaikwad@hostelos.edu','+91 98201 10057','student','https://api.dicebear.com/9.x/initials/svg?seed=Shankar%20Gaikwad&backgroundColor=0284c7&textColor=ffffff','A-303','Block A (Newton)','Bed 2','21BCS058','B.Tech ME',2,'Gaikwad Senior','+91 98200 20057','pending',4500,86,'2026-11-02 17:37:36.671556');
INSERT INTO profiles VALUES('std-59','Dinesh Bhosale','dinesh.bhosale@hostelos.edu','+91 98201 10058','student','https://api.dicebear.com/9.x/initials/svg?seed=Dinesh%20Bhosale&backgroundColor=0284c7&textColor=ffffff','A-303','Block A (Newton)','Bed 3','21BCS059','B.Tech CE',3,'Bhosale Senior','+91 98200 20058','partial',2250,87,'2026-11-02 17:37:36.671556');
INSERT INTO profiles VALUES('std-60','Ajay Deshpande','ajay.deshpande@hostelos.edu','+91 98201 10059','student','https://api.dicebear.com/9.x/initials/svg?seed=Ajay%20Deshpande&backgroundColor=0284c7&textColor=ffffff','A-303','Block A (Newton)','Bed 4','21BCS060','B.Tech IT',4,'Deshpande Senior','+91 98200 20059','paid',0,88,'2026-11-02 17:37:36.671556');
INSERT INTO profiles VALUES('std-61','Anirban Sharma','anirban.sharma@hostelos.edu','+91 98201 10060','student','https://api.dicebear.com/9.x/initials/svg?seed=Anirban%20Sharma&backgroundColor=0284c7&textColor=ffffff','A-304','Block A (Newton)','Bed 1','21BCS061','B.Tech CSE',1,'Sharma Senior','+91 98200 20060','paid',0,89,'2026-11-02 17:37:36.671557');
INSERT INTO profiles VALUES('std-62','Debashis Verma','debashis.verma@hostelos.edu','+91 98201 10061','student','https://api.dicebear.com/9.x/initials/svg?seed=Debashis%20Verma&backgroundColor=0284c7&textColor=ffffff','A-304','Block A (Newton)','Bed 2','21BCS062','B.Tech ECE',2,'Verma Senior','+91 98200 20061','paid',0,90,'2026-11-02 17:37:36.671557');
INSERT INTO profiles VALUES('std-63','Sourav Mishra','sourav.mishra@hostelos.edu','+91 98201 10062','student','https://api.dicebear.com/9.x/initials/svg?seed=Sourav%20Mishra&backgroundColor=0284c7&textColor=ffffff','A-304','Block A (Newton)','Bed 3','21BCS063','B.Tech ME',3,'Mishra Senior','+91 98200 20062','pending',4500,91,'2026-11-02 17:37:36.671558');
INSERT INTO profiles VALUES('std-64','Subhash Tiwari','subhash.tiwari@hostelos.edu','+91 98201 10063','student','https://api.dicebear.com/9.x/initials/svg?seed=Subhash%20Tiwari&backgroundColor=0284c7&textColor=ffffff','A-304','Block A (Newton)','Bed 4','21BCS064','B.Tech CE',4,'Tiwari Senior','+91 98200 20063','partial',2250,92,'2026-11-02 17:37:36.671558');
INSERT INTO profiles VALUES('std-65','Joydeep Chauhan','joydeep.chauhan@hostelos.edu','+91 98201 10064','student','https://api.dicebear.com/9.x/initials/svg?seed=Joydeep%20Chauhan&backgroundColor=0284c7&textColor=ffffff','A-305','Block A (Newton)','Bed 1','21BCS065','B.Tech IT',1,'Chauhan Senior','+91 98200 20064','paid',0,93,'2026-11-02 17:37:36.671559');
INSERT INTO profiles VALUES('std-66','Pritam Bhatia','pritam.bhatia@hostelos.edu','+91 98201 10065','student','https://api.dicebear.com/9.x/initials/svg?seed=Pritam%20Bhatia&backgroundColor=0284c7&textColor=ffffff','A-305','Block A (Newton)','Bed 2','21BCS066','B.Tech CSE',2,'Bhatia Senior','+91 98200 20065','paid',0,94,'2026-11-02 17:37:36.671559');
INSERT INTO profiles VALUES('std-67','Abhijit Saxena','abhijit.saxena@hostelos.edu','+91 98201 10066','student','https://api.dicebear.com/9.x/initials/svg?seed=Abhijit%20Saxena&backgroundColor=0284c7&textColor=ffffff','A-305','Block A (Newton)','Bed 3','21BCS067','B.Tech ECE',3,'Saxena Senior','+91 98200 20066','paid',0,95,'2026-11-02 17:37:36.671559');
INSERT INTO profiles VALUES('std-68','Tanmoy Kapoor','tanmoy.kapoor@hostelos.edu','+91 98201 10067','student','https://api.dicebear.com/9.x/initials/svg?seed=Tanmoy%20Kapoor&backgroundColor=0284c7&textColor=ffffff','A-305','Block A (Newton)','Bed 4','21BCS068','B.Tech ME',4,'Kapoor Senior','+91 98200 20067','pending',4500,96,'2026-11-02 17:37:36.671560');
INSERT INTO profiles VALUES('std-69','Bikram Gupta','bikram.gupta@hostelos.edu','+91 98201 10068','student','https://api.dicebear.com/9.x/initials/svg?seed=Bikram%20Gupta&backgroundColor=0284c7&textColor=ffffff','A-306','Block A (Newton)','Bed 1','21BCS069','B.Tech CE',1,'Gupta Senior','+91 98200 20068','partial',2250,97,'2026-11-02 17:37:36.671560');
INSERT INTO profiles VALUES('std-70','Indrajit Malhotra','indrajit.malhotra@hostelos.edu','+91 98201 10069','student','https://api.dicebear.com/9.x/initials/svg?seed=Indrajit%20Malhotra&backgroundColor=0284c7&textColor=ffffff','A-306','Block A (Newton)','Bed 2','21BCS070','B.Tech IT',2,'Malhotra Senior','+91 98200 20069','paid',0,98,'2026-11-02 17:37:36.671561');
INSERT INTO profiles VALUES('std-71','Prosenjit Pandey','prosenjit.pandey@hostelos.edu','+91 98201 10070','student','https://api.dicebear.com/9.x/initials/svg?seed=Prosenjit%20Pandey&backgroundColor=0284c7&textColor=ffffff','A-306','Block A (Newton)','Bed 3','21BCS071','B.Tech CSE',3,'Pandey Senior','+91 98200 20070','paid',0,85,'2026-11-02 17:37:36.671561');
INSERT INTO profiles VALUES('std-72','Arup Shukla','arup.shukla@hostelos.edu','+91 98201 10071','student','https://api.dicebear.com/9.x/initials/svg?seed=Arup%20Shukla&backgroundColor=0284c7&textColor=ffffff','A-306','Block A (Newton)','Bed 4','21BCS072','B.Tech ECE',4,'Shukla Senior','+91 98200 20071','paid',0,86,'2026-11-02 17:37:36.671562');
INSERT INTO profiles VALUES('std-73','Sujit Yadav','sujit.yadav@hostelos.edu','+91 98201 10072','student','https://api.dicebear.com/9.x/initials/svg?seed=Sujit%20Yadav&backgroundColor=0284c7&textColor=ffffff','A-401','Block A (Newton)','Bed 1','21BCS073','B.Tech ME',1,'Yadav Senior','+91 98200 20072','pending',4500,87,'2026-11-02 17:37:36.671562');
INSERT INTO profiles VALUES('std-74','Dipankar Singh','dipankar.singh@hostelos.edu','+91 98201 10073','student','https://api.dicebear.com/9.x/initials/svg?seed=Dipankar%20Singh&backgroundColor=0284c7&textColor=ffffff','A-401','Block A (Newton)','Bed 2','21BCS074','B.Tech CE',2,'Singh Senior','+91 98200 20073','partial',2250,88,'2026-11-02 17:37:36.671562');
INSERT INTO profiles VALUES('std-75','Partha Rathore','partha.rathore@hostelos.edu','+91 98201 10074','student','https://api.dicebear.com/9.x/initials/svg?seed=Partha%20Rathore&backgroundColor=0284c7&textColor=ffffff','A-401','Block A (Newton)','Bed 3','21BCS075','B.Tech IT',3,'Rathore Senior','+91 98200 20074','paid',0,89,'2026-11-02 17:37:36.671563');
INSERT INTO profiles VALUES('std-76','Samir Nair','samir.nair@hostelos.edu','+91 98201 10075','student','https://api.dicebear.com/9.x/initials/svg?seed=Samir%20Nair&backgroundColor=0284c7&textColor=ffffff','A-401','Block A (Newton)','Bed 4','21BCS076','B.Tech CSE',4,'Nair Senior','+91 98200 20075','paid',0,90,'2026-11-02 17:37:36.671563');
INSERT INTO profiles VALUES('std-77','Nilanjan Subramanian','nilanjan.subramanian@hostelos.edu','+91 98201 10076','student','https://api.dicebear.com/9.x/initials/svg?seed=Nilanjan%20Subramanian&backgroundColor=0284c7&textColor=ffffff','A-402','Block A (Newton)','Bed 1','21BCS077','B.Tech ECE',1,'Subramanian Senior','+91 98200 20076','paid',0,91,'2026-11-02 17:37:36.671564');
INSERT INTO profiles VALUES('std-78','Kaushik Iyer','kaushik.iyer@hostelos.edu','+91 98201 10077','student','https://api.dicebear.com/9.x/initials/svg?seed=Kaushik%20Iyer&backgroundColor=0284c7&textColor=ffffff','A-402','Block A (Newton)','Bed 2','21BCS078','B.Tech ME',2,'Iyer Senior','+91 98200 20077','pending',4500,92,'2026-11-02 17:37:36.671564');
INSERT INTO profiles VALUES('std-79','Debabrata Murthy','debabrata.murthy@hostelos.edu','+91 98201 10078','student','https://api.dicebear.com/9.x/initials/svg?seed=Debabrata%20Murthy&backgroundColor=0284c7&textColor=ffffff','A-402','Block A (Newton)','Bed 3','21BCS079','B.Tech CE',3,'Murthy Senior','+91 98200 20078','partial',2250,93,'2026-11-02 17:37:36.671565');
INSERT INTO profiles VALUES('std-80','Satyajit Reddy','satyajit.reddy@hostelos.edu','+91 98201 10079','student','https://api.dicebear.com/9.x/initials/svg?seed=Satyajit%20Reddy&backgroundColor=0284c7&textColor=ffffff','A-402','Block A (Newton)','Bed 4','21BCS080','B.Tech IT',4,'Reddy Senior','+91 98200 20079','paid',0,94,'2026-11-02 17:37:36.671565');
INSERT INTO profiles VALUES('std-81','Tapas Menon','tapas.menon@hostelos.edu','+91 98201 10080','student','https://api.dicebear.com/9.x/initials/svg?seed=Tapas%20Menon&backgroundColor=0284c7&textColor=ffffff','A-403','Block A (Newton)','Bed 1','21BCS081','B.Tech CSE',1,'Menon Senior','+91 98200 20080','paid',0,95,'2026-11-02 17:37:36.671565');
INSERT INTO profiles VALUES('std-82','Prabir Venkatesh','prabir.venkatesh@hostelos.edu','+91 98201 10081','student','https://api.dicebear.com/9.x/initials/svg?seed=Prabir%20Venkatesh&backgroundColor=0284c7&textColor=ffffff','A-403','Block A (Newton)','Bed 2','21BCS082','B.Tech ECE',2,'Venkatesh Senior','+91 98200 20081','paid',0,96,'2026-11-02 17:37:36.671566');
INSERT INTO profiles VALUES('std-83','Chandan Swaminathan','chandan.swaminathan@hostelos.edu','+91 98201 10082','student','https://api.dicebear.com/9.x/initials/svg?seed=Chandan%20Swaminathan&backgroundColor=0284c7&textColor=ffffff','A-403','Block A (Newton)','Bed 3','21BCS083','B.Tech ME',3,'Swaminathan Senior','+91 98200 20082','pending',4500,97,'2026-11-02 17:37:36.671566');
INSERT INTO profiles VALUES('std-84','Shantanu Pillai','shantanu.pillai@hostelos.edu','+91 98201 10083','student','https://api.dicebear.com/9.x/initials/svg?seed=Shantanu%20Pillai&backgroundColor=0284c7&textColor=ffffff','A-403','Block A (Newton)','Bed 4','21BCS084','B.Tech CE',4,'Pillai Senior','+91 98200 20083','partial',2250,98,'2026-11-02 17:37:36.671567');
INSERT INTO profiles VALUES('std-85','Subrata Rao','subrata.rao@hostelos.edu','+91 98201 10084','student','https://api.dicebear.com/9.x/initials/svg?seed=Subrata%20Rao&backgroundColor=0284c7&textColor=ffffff','A-404','Block A (Newton)','Bed 1','21BCS085','B.Tech IT',1,'Rao Senior','+91 98200 20084','paid',0,85,'2026-11-02 17:37:36.671567');
INSERT INTO profiles VALUES('std-86','Subir Nambiar','subir.nambiar@hostelos.edu','+91 98201 10085','student','https://api.dicebear.com/9.x/initials/svg?seed=Subir%20Nambiar&backgroundColor=0284c7&textColor=ffffff','A-404','Block A (Newton)','Bed 2','21BCS086','B.Tech CSE',2,'Nambiar Senior','+91 98200 20085','paid',0,86,'2026-11-02 17:37:36.671567');
INSERT INTO profiles VALUES('std-87','Chinmoy Balaji','chinmoy.balaji@hostelos.edu','+91 98201 10086','student','https://api.dicebear.com/9.x/initials/svg?seed=Chinmoy%20Balaji&backgroundColor=0284c7&textColor=ffffff','A-404','Block A (Newton)','Bed 3','21BCS087','B.Tech ECE',3,'Balaji Senior','+91 98200 20086','paid',0,87,'2026-11-02 17:37:36.671568');
INSERT INTO profiles VALUES('std-88','Bhabesh Krishnan','bhabesh.krishnan@hostelos.edu','+91 98201 10087','student','https://api.dicebear.com/9.x/initials/svg?seed=Bhabesh%20Krishnan&backgroundColor=0284c7&textColor=ffffff','A-404','Block A (Newton)','Bed 4','21BCS088','B.Tech ME',4,'Krishnan Senior','+91 98200 20087','pending',4500,88,'2026-11-02 17:37:36.671568');
INSERT INTO profiles VALUES('std-89','Pradip Naidu','pradip.naidu@hostelos.edu','+91 98201 10088','student','https://api.dicebear.com/9.x/initials/svg?seed=Pradip%20Naidu&backgroundColor=0284c7&textColor=ffffff','A-405','Block A (Newton)','Bed 1','21BCS089','B.Tech CE',1,'Naidu Senior','+91 98200 20088','partial',2250,89,'2026-11-02 17:37:36.671569');
INSERT INTO profiles VALUES('std-90','Monojit Shetty','monojit.shetty@hostelos.edu','+91 98201 10089','student','https://api.dicebear.com/9.x/initials/svg?seed=Monojit%20Shetty&backgroundColor=0284c7&textColor=ffffff','A-405','Block A (Newton)','Bed 2','21BCS090','B.Tech IT',2,'Shetty Senior','+91 98200 20089','paid',0,90,'2026-11-02 17:37:36.671569');
INSERT INTO profiles VALUES('std-91','Dev Banerjee','dev.banerjee@hostelos.edu','+91 98201 10090','student','https://api.dicebear.com/9.x/initials/svg?seed=Dev%20Banerjee&backgroundColor=0284c7&textColor=ffffff','A-405','Block A (Newton)','Bed 3','21BCS091','B.Tech CSE',3,'Banerjee Senior','+91 98200 20090','paid',0,91,'2026-11-02 17:37:36.671570');
INSERT INTO profiles VALUES('std-92','Chirag Mukherjee','chirag.mukherjee@hostelos.edu','+91 98201 10091','student','https://api.dicebear.com/9.x/initials/svg?seed=Chirag%20Mukherjee&backgroundColor=0284c7&textColor=ffffff','A-405','Block A (Newton)','Bed 4','21BCS092','B.Tech ECE',4,'Mukherjee Senior','+91 98200 20091','paid',0,92,'2026-11-02 17:37:36.671570');
INSERT INTO profiles VALUES('std-93','Harshil Chatterjee','harshil.chatterjee@hostelos.edu','+91 98201 10092','student','https://api.dicebear.com/9.x/initials/svg?seed=Harshil%20Chatterjee&backgroundColor=0284c7&textColor=ffffff','A-406','Block A (Newton)','Bed 1','21BCS093','B.Tech ME',1,'Chatterjee Senior','+91 98200 20092','pending',4500,93,'2026-11-02 17:37:36.671570');
INSERT INTO profiles VALUES('std-94','Parth Roy','parth.roy@hostelos.edu','+91 98201 10093','student','https://api.dicebear.com/9.x/initials/svg?seed=Parth%20Roy&backgroundColor=0284c7&textColor=ffffff','A-406','Block A (Newton)','Bed 2','21BCS094','B.Tech CE',2,'Roy Senior','+91 98200 20093','partial',2250,94,'2026-11-02 17:37:36.671571');
INSERT INTO profiles VALUES('std-95','Tanmay Sengupta','tanmay.sengupta@hostelos.edu','+91 98201 10094','student','https://api.dicebear.com/9.x/initials/svg?seed=Tanmay%20Sengupta&backgroundColor=0284c7&textColor=ffffff','A-406','Block A (Newton)','Bed 3','21BCS095','B.Tech IT',3,'Sengupta Senior','+91 98200 20094','paid',0,95,'2026-11-02 17:37:36.671571');
INSERT INTO profiles VALUES('std-96','Bhavesh Das','bhavesh.das@hostelos.edu','+91 98201 10095','student','https://api.dicebear.com/9.x/initials/svg?seed=Bhavesh%20Das&backgroundColor=0284c7&textColor=ffffff','A-406','Block A (Newton)','Bed 4','21BCS096','B.Tech CSE',4,'Das Senior','+91 98200 20095','paid',0,96,'2026-11-02 17:37:36.671572');
INSERT INTO profiles VALUES('std-97','Omkar Dutta','omkar.dutta@hostelos.edu','+91 98201 10096','student','https://api.dicebear.com/9.x/initials/svg?seed=Omkar%20Dutta&backgroundColor=0284c7&textColor=ffffff','A-501','Block A (Newton)','Bed 1','21BCS097','B.Tech ECE',1,'Dutta Senior','+91 98200 20096','paid',0,97,'2026-11-02 17:37:36.671572');
INSERT INTO profiles VALUES('std-98','Chinmay Ghosh','chinmay.ghosh@hostelos.edu','+91 98201 10097','student','https://api.dicebear.com/9.x/initials/svg?seed=Chinmay%20Ghosh&backgroundColor=0284c7&textColor=ffffff','A-501','Block A (Newton)','Bed 2','21BCS098','B.Tech ME',2,'Ghosh Senior','+91 98200 20097','pending',4500,98,'2026-11-02 17:37:36.671573');
INSERT INTO profiles VALUES('std-99','Darshan Bhattacharya','darshan.bhattacharya@hostelos.edu','+91 98201 10098','student','https://api.dicebear.com/9.x/initials/svg?seed=Darshan%20Bhattacharya&backgroundColor=0284c7&textColor=ffffff','A-501','Block A (Newton)','Bed 3','21BCS099','B.Tech CE',3,'Bhattacharya Senior','+91 98200 20098','partial',2250,85,'2026-11-02 17:37:36.671573');
INSERT INTO profiles VALUES('std-100','Eashan Bose','eashan.bose@hostelos.edu','+91 98201 10099','student','https://api.dicebear.com/9.x/initials/svg?seed=Eashan%20Bose&backgroundColor=0284c7&textColor=ffffff','A-501','Block A (Newton)','Bed 4','21BCS100','B.Tech IT',4,'Bose Senior','+91 98200 20099','paid',0,86,'2026-11-02 17:37:36.671573');
INSERT INTO profiles VALUES('std-101','Hardik Majumdar','hardik.majumdar@hostelos.edu','+91 98201 10100','student','https://api.dicebear.com/9.x/initials/svg?seed=Hardik%20Majumdar&backgroundColor=0284c7&textColor=ffffff','A-502','Block A (Newton)','Bed 1','21BCS101','B.Tech CSE',1,'Majumdar Senior','+91 98200 20100','paid',0,87,'2026-11-02 17:37:36.671574');
INSERT INTO profiles VALUES('std-102','Jaideep Chakraborty','jaideep.chakraborty@hostelos.edu','+91 98201 10101','student','https://api.dicebear.com/9.x/initials/svg?seed=Jaideep%20Chakraborty&backgroundColor=0284c7&textColor=ffffff','A-502','Block A (Newton)','Bed 2','21BCS102','B.Tech ECE',2,'Chakraborty Senior','+91 98200 20101','paid',0,88,'2026-11-02 17:37:36.671574');
INSERT INTO profiles VALUES('std-103','Chetan Ganguly','chetan.ganguly@hostelos.edu','+91 98201 10102','student','https://api.dicebear.com/9.x/initials/svg?seed=Chetan%20Ganguly&backgroundColor=0284c7&textColor=ffffff','A-502','Block A (Newton)','Bed 3','21BCS103','B.Tech ME',3,'Ganguly Senior','+91 98200 20102','pending',4500,89,'2026-11-02 17:37:36.671575');
INSERT INTO profiles VALUES('std-104','Hemant Mitra','hemant.mitra@hostelos.edu','+91 98201 10103','student','https://api.dicebear.com/9.x/initials/svg?seed=Hemant%20Mitra&backgroundColor=0284c7&textColor=ffffff','A-502','Block A (Newton)','Bed 4','21BCS104','B.Tech CE',4,'Mitra Senior','+91 98200 20103','partial',2250,90,'2026-11-02 17:37:36.671575');
INSERT INTO profiles VALUES('std-105','Jitin Saha','jitin.saha@hostelos.edu','+91 98201 10104','student','https://api.dicebear.com/9.x/initials/svg?seed=Jitin%20Saha&backgroundColor=0284c7&textColor=ffffff','A-503','Block A (Newton)','Bed 1','21BCS105','B.Tech IT',1,'Saha Senior','+91 98200 20104','paid',0,91,'2026-11-02 17:37:36.671575');
INSERT INTO profiles VALUES('std-106','Kishan Patel','kishan.patel@hostelos.edu','+91 98201 10105','student','https://api.dicebear.com/9.x/initials/svg?seed=Kishan%20Patel&backgroundColor=0284c7&textColor=ffffff','A-503','Block A (Newton)','Bed 2','21BCS106','B.Tech CSE',2,'Patel Senior','+91 98200 20105','paid',0,92,'2026-11-02 17:37:36.671576');
INSERT INTO profiles VALUES('std-107','Manav Dixit','manav.dixit@hostelos.edu','+91 98201 10106','student','https://api.dicebear.com/9.x/initials/svg?seed=Manav%20Dixit&backgroundColor=0284c7&textColor=ffffff','A-503','Block A (Newton)','Bed 3','21BCS107','B.Tech ECE',3,'Dixit Senior','+91 98200 20106','paid',0,93,'2026-11-02 17:37:36.671576');
INSERT INTO profiles VALUES('std-108','Nishant Mehta','nishant.mehta@hostelos.edu','+91 98201 10107','student','https://api.dicebear.com/9.x/initials/svg?seed=Nishant%20Mehta&backgroundColor=0284c7&textColor=ffffff','A-503','Block A (Newton)','Bed 4','21BCS108','B.Tech ME',4,'Mehta Senior','+91 98200 20107','pending',4500,94,'2026-11-02 17:37:36.671577');
INSERT INTO profiles VALUES('std-109','Vedant Shah','vedant.shah@hostelos.edu','+91 98201 10108','student','https://api.dicebear.com/9.x/initials/svg?seed=Vedant%20Shah&backgroundColor=0284c7&textColor=ffffff','A-504','Block A (Newton)','Bed 1','21BCS109','B.Tech CE',1,'Shah Senior','+91 98200 20108','partial',2250,95,'2026-11-02 17:37:36.671577');
INSERT INTO profiles VALUES('std-110','Yuvraj Kulkarni','yuvraj.kulkarni@hostelos.edu','+91 98201 10109','student','https://api.dicebear.com/9.x/initials/svg?seed=Yuvraj%20Kulkarni&backgroundColor=0284c7&textColor=ffffff','A-504','Block A (Newton)','Bed 2','21BCS110','B.Tech IT',2,'Kulkarni Senior','+91 98200 20109','paid',0,96,'2026-11-02 17:37:36.671578');
INSERT INTO profiles VALUES('std-111','Sachin Joshi','sachin.joshi@hostelos.edu','+91 98201 10110','student','https://api.dicebear.com/9.x/initials/svg?seed=Sachin%20Joshi&backgroundColor=0284c7&textColor=ffffff','A-504','Block A (Newton)','Bed 3','21BCS111','B.Tech CSE',3,'Joshi Senior','+91 98200 20110','paid',0,97,'2026-11-02 17:37:36.671578');
INSERT INTO profiles VALUES('std-112','Tushar Deshmukh','tushar.deshmukh@hostelos.edu','+91 98201 10111','student','https://api.dicebear.com/9.x/initials/svg?seed=Tushar%20Deshmukh&backgroundColor=0284c7&textColor=ffffff','A-504','Block A (Newton)','Bed 4','21BCS112','B.Tech ECE',4,'Deshmukh Senior','+91 98200 20111','paid',0,98,'2026-11-02 17:37:36.671578');
INSERT INTO profiles VALUES('std-113','Akash Marathe','akash.marathe@hostelos.edu','+91 98201 10112','student','https://api.dicebear.com/9.x/initials/svg?seed=Akash%20Marathe&backgroundColor=0284c7&textColor=ffffff','A-505','Block A (Newton)','Bed 1','21BCS113','B.Tech ME',1,'Marathe Senior','+91 98200 20112','pending',4500,85,'2026-11-02 17:37:36.671579');
INSERT INTO profiles VALUES('std-114','Sameer Pawar','sameer.pawar@hostelos.edu','+91 98201 10113','student','https://api.dicebear.com/9.x/initials/svg?seed=Sameer%20Pawar&backgroundColor=0284c7&textColor=ffffff','A-505','Block A (Newton)','Bed 2','21BCS114','B.Tech CE',2,'Pawar Senior','+91 98200 20113','partial',2250,86,'2026-11-02 17:37:36.671579');
INSERT INTO profiles VALUES('std-115','Pankaj Shinde','pankaj.shinde@hostelos.edu','+91 98201 10114','student','https://api.dicebear.com/9.x/initials/svg?seed=Pankaj%20Shinde&backgroundColor=0284c7&textColor=ffffff','A-505','Block A (Newton)','Bed 3','21BCS115','B.Tech IT',3,'Shinde Senior','+91 98200 20114','paid',0,87,'2026-11-02 17:37:36.671580');
INSERT INTO profiles VALUES('std-116','Sumit Patil','sumit.patil@hostelos.edu','+91 98201 10115','student','https://api.dicebear.com/9.x/initials/svg?seed=Sumit%20Patil&backgroundColor=0284c7&textColor=ffffff','A-505','Block A (Newton)','Bed 4','21BCS116','B.Tech CSE',4,'Patil Senior','+91 98200 20115','paid',0,88,'2026-11-02 17:37:36.671580');
INSERT INTO profiles VALUES('std-117','Milind Chavan','milind.chavan@hostelos.edu','+91 98201 10116','student','https://api.dicebear.com/9.x/initials/svg?seed=Milind%20Chavan&backgroundColor=0284c7&textColor=ffffff','A-506','Block A (Newton)','Bed 1','21BCS117','B.Tech ECE',1,'Chavan Senior','+91 98200 20116','paid',0,89,'2026-11-02 17:37:36.671581');
INSERT INTO profiles VALUES('std-118','Makarand Gaikwad','makarand.gaikwad@hostelos.edu','+91 98201 10117','student','https://api.dicebear.com/9.x/initials/svg?seed=Makarand%20Gaikwad&backgroundColor=0284c7&textColor=ffffff','A-506','Block A (Newton)','Bed 2','21BCS118','B.Tech ME',2,'Gaikwad Senior','+91 98200 20117','pending',4500,90,'2026-11-02 17:37:36.671581');
INSERT INTO profiles VALUES('std-119','Sarang Bhosale','sarang.bhosale@hostelos.edu','+91 98201 10118','student','https://api.dicebear.com/9.x/initials/svg?seed=Sarang%20Bhosale&backgroundColor=0284c7&textColor=ffffff','A-506','Block A (Newton)','Bed 3','21BCS119','B.Tech CE',3,'Bhosale Senior','+91 98200 20118','partial',2250,91,'2026-11-02 17:37:36.671581');
INSERT INTO profiles VALUES('std-120','Swapnil Deshpande','swapnil.deshpande@hostelos.edu','+91 98201 10119','student','https://api.dicebear.com/9.x/initials/svg?seed=Swapnil%20Deshpande&backgroundColor=0284c7&textColor=ffffff','A-506','Block A (Newton)','Bed 4','21BCS120','B.Tech IT',4,'Deshpande Senior','+91 98200 20119','paid',0,92,'2026-11-02 17:37:36.671582');
CREATE TABLE rooms (
	id VARCHAR NOT NULL, 
	number VARCHAR NOT NULL, 
	block_id VARCHAR, 
	block_name VARCHAR, 
	floor INTEGER, 
	type VARCHAR, 
	capacity INTEGER, 
	occupied INTEGER, 
	status VARCHAR, 
	amenities JSON, 
	occupants JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(block_id) REFERENCES blocks (id) ON DELETE SET NULL
);
INSERT INTO rooms VALUES('rm-a-101','A-101','blk-a','Block A (Newton)',1,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "usr-student-1", "name": "Aarav Patel", "rollNo": "21BCS001", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Sharma&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-2", "name": "Rohan Verma", "rollNo": "21BCS002", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Rohan%20Verma&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-3", "name": "Aditya Mishra", "rollNo": "21BCS003", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Aditya%20Mishra&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-4", "name": "Vivaan Tiwari", "rollNo": "21BCS004", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vivaan%20Tiwari&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673664');
INSERT INTO rooms VALUES('rm-a-102','A-102','blk-a','Block A (Newton)',1,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-5", "name": "Harsh Chauhan", "rollNo": "21BCS005", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Harsh%20Chauhan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-6", "name": "Kabir Bhatia", "rollNo": "21BCS006", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kabir%20Bhatia&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-7", "name": "Ayush Saxena", "rollNo": "21BCS007", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ayush%20Saxena&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-8", "name": "Kunal Kapoor", "rollNo": "21BCS008", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kunal%20Kapoor&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673666');
INSERT INTO rooms VALUES('rm-a-103','A-103','blk-a','Block A (Newton)',1,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-9", "name": "Mohit Gupta", "rollNo": "21BCS009", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Mohit%20Gupta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-10", "name": "Rahul Malhotra", "rollNo": "21BCS010", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Rahul%20Malhotra&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-11", "name": "Deepak Pandey", "rollNo": "21BCS011", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Deepak%20Pandey&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-12", "name": "Sanjay Shukla", "rollNo": "21BCS012", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sanjay%20Shukla&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673666');
INSERT INTO rooms VALUES('rm-a-104','A-104','blk-a','Block A (Newton)',1,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-13", "name": "Alok Yadav", "rollNo": "21BCS013", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Alok%20Yadav&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-14", "name": "Rajeev Singh", "rollNo": "21BCS014", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Rajeev%20Singh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-15", "name": "Naveen Rathore", "rollNo": "21BCS015", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Naveen%20Rathore&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-16", "name": "Vikas Nair", "rollNo": "21BCS016", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vikas%20Nair&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673667');
INSERT INTO rooms VALUES('rm-a-105','A-105','blk-a','Block A (Newton)',1,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-17", "name": "Abhishek Subramanian", "rollNo": "21BCS017", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Abhishek%20Subramanian&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-18", "name": "Gautam Iyer", "rollNo": "21BCS018", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Gautam%20Iyer&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-19", "name": "Neeraj Murthy", "rollNo": "21BCS019", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Neeraj%20Murthy&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-20", "name": "Tarun Reddy", "rollNo": "21BCS020", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tarun%20Reddy&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673667');
INSERT INTO rooms VALUES('rm-a-106','A-106','blk-a','Block A (Newton)',1,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-21", "name": "Ankit Menon", "rollNo": "21BCS021", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ankit%20Menon&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-22", "name": "Sourabh Venkatesh", "rollNo": "21BCS022", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sourabh%20Venkatesh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-23", "name": "Mayank Swaminathan", "rollNo": "21BCS023", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Mayank%20Swaminathan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-24", "name": "Harshit Pillai", "rollNo": "21BCS024", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Harshit%20Pillai&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673668');
INSERT INTO rooms VALUES('rm-a-201','A-201','blk-a','Block A (Newton)',2,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-25", "name": "Utkarsh Rao", "rollNo": "21BCS025", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Utkarsh%20Rao&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-26", "name": "Kartik Nambiar", "rollNo": "21BCS026", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kartik%20Nambiar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-27", "name": "Lokesh Balaji", "rollNo": "21BCS027", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Lokesh%20Balaji&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-28", "name": "Raghav Krishnan", "rollNo": "21BCS028", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Raghav%20Krishnan&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673668');
INSERT INTO rooms VALUES('rm-a-202','A-202','blk-a','Block A (Newton)',2,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-29", "name": "Shubham Naidu", "rollNo": "21BCS029", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Shubham%20Naidu&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-30", "name": "Uday Shetty", "rollNo": "21BCS030", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Uday%20Shetty&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-31", "name": "Siddharth Banerjee", "rollNo": "21BCS031", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Siddharth%20Banerjee&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-32", "name": "Vignesh Mukherjee", "rollNo": "21BCS032", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vignesh%20Mukherjee&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673669');
INSERT INTO rooms VALUES('rm-a-203','A-203','blk-a','Block A (Newton)',2,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-33", "name": "Karthik Chatterjee", "rollNo": "21BCS033", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Karthik%20Chatterjee&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-34", "name": "Pranav Roy", "rollNo": "21BCS034", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Pranav%20Roy&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-35", "name": "Sai Sengupta", "rollNo": "21BCS035", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sai%20Sengupta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-36", "name": "Ashwin Das", "rollNo": "21BCS036", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ashwin%20Das&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673669');
INSERT INTO rooms VALUES('rm-a-204','A-204','blk-a','Block A (Newton)',2,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-37", "name": "Balakrishnan Dutta", "rollNo": "21BCS037", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Balakrishnan%20Dutta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-38", "name": "Dhanush Ghosh", "rollNo": "21BCS038", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Dhanush%20Ghosh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-39", "name": "Arvind Bhattacharya", "rollNo": "21BCS039", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Arvind%20Bhattacharya&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-40", "name": "Surya Bose", "rollNo": "21BCS040", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Surya%20Bose&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673670');
INSERT INTO rooms VALUES('rm-a-205','A-205','blk-a','Block A (Newton)',2,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-41", "name": "Manoj Majumdar", "rollNo": "21BCS041", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Manoj%20Majumdar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-42", "name": "Praveen Chakraborty", "rollNo": "21BCS042", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Praveen%20Chakraborty&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-43", "name": "Suresh Ganguly", "rollNo": "21BCS043", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Suresh%20Ganguly&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-44", "name": "Ramesh Mitra", "rollNo": "21BCS044", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ramesh%20Mitra&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673670');
INSERT INTO rooms VALUES('rm-a-206','A-206','blk-a','Block A (Newton)',2,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-45", "name": "Ganesh Saha", "rollNo": "21BCS045", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ganesh%20Saha&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-46", "name": "Venkat Patel", "rollNo": "21BCS046", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Venkat%20Patel&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-47", "name": "Hari Dixit", "rollNo": "21BCS047", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Hari%20Dixit&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-48", "name": "Vijay Mehta", "rollNo": "21BCS048", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vijay%20Mehta&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673671');
INSERT INTO rooms VALUES('rm-a-301','A-301','blk-a','Block A (Newton)',3,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-49", "name": "Kishore Shah", "rollNo": "21BCS049", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kishore%20Shah&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-50", "name": "Anand Kulkarni", "rollNo": "21BCS050", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Anand%20Kulkarni&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-51", "name": "Madhav Joshi", "rollNo": "21BCS051", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Madhav%20Joshi&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-52", "name": "Sriram Deshmukh", "rollNo": "21BCS052", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sriram%20Deshmukh&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673671');
INSERT INTO rooms VALUES('rm-a-302','A-302','blk-a','Block A (Newton)',3,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-53", "name": "Varun Marathe", "rollNo": "21BCS053", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Varun%20Marathe&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-54", "name": "Nikhil Pawar", "rollNo": "21BCS054", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Nikhil%20Pawar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-55", "name": "Vishnu Shinde", "rollNo": "21BCS055", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vishnu%20Shinde&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-56", "name": "Kalyan Patil", "rollNo": "21BCS056", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kalyan%20Patil&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673672');
INSERT INTO rooms VALUES('rm-a-303','A-303','blk-a','Block A (Newton)',3,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-57", "name": "Girish Chavan", "rollNo": "21BCS057", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Girish%20Chavan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-58", "name": "Shankar Gaikwad", "rollNo": "21BCS058", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Shankar%20Gaikwad&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-59", "name": "Dinesh Bhosale", "rollNo": "21BCS059", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Dinesh%20Bhosale&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-60", "name": "Ajay Deshpande", "rollNo": "21BCS060", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ajay%20Deshpande&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673672');
INSERT INTO rooms VALUES('rm-a-304','A-304','blk-a','Block A (Newton)',3,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-61", "name": "Anirban Sharma", "rollNo": "21BCS061", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Anirban%20Sharma&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-62", "name": "Debashis Verma", "rollNo": "21BCS062", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Debashis%20Verma&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-63", "name": "Sourav Mishra", "rollNo": "21BCS063", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sourav%20Mishra&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-64", "name": "Subhash Tiwari", "rollNo": "21BCS064", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Subhash%20Tiwari&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673673');
INSERT INTO rooms VALUES('rm-a-305','A-305','blk-a','Block A (Newton)',3,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-65", "name": "Joydeep Chauhan", "rollNo": "21BCS065", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Joydeep%20Chauhan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-66", "name": "Pritam Bhatia", "rollNo": "21BCS066", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Pritam%20Bhatia&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-67", "name": "Abhijit Saxena", "rollNo": "21BCS067", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Abhijit%20Saxena&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-68", "name": "Tanmoy Kapoor", "rollNo": "21BCS068", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tanmoy%20Kapoor&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673673');
INSERT INTO rooms VALUES('rm-a-306','A-306','blk-a','Block A (Newton)',3,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-69", "name": "Bikram Gupta", "rollNo": "21BCS069", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Bikram%20Gupta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-70", "name": "Indrajit Malhotra", "rollNo": "21BCS070", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Indrajit%20Malhotra&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-71", "name": "Prosenjit Pandey", "rollNo": "21BCS071", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Prosenjit%20Pandey&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-72", "name": "Arup Shukla", "rollNo": "21BCS072", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Arup%20Shukla&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673673');
INSERT INTO rooms VALUES('rm-a-401','A-401','blk-a','Block A (Newton)',4,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-73", "name": "Sujit Yadav", "rollNo": "21BCS073", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sujit%20Yadav&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-74", "name": "Dipankar Singh", "rollNo": "21BCS074", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Dipankar%20Singh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-75", "name": "Partha Rathore", "rollNo": "21BCS075", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Partha%20Rathore&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-76", "name": "Samir Nair", "rollNo": "21BCS076", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Samir%20Nair&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673674');
INSERT INTO rooms VALUES('rm-a-402','A-402','blk-a','Block A (Newton)',4,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-77", "name": "Nilanjan Subramanian", "rollNo": "21BCS077", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Nilanjan%20Subramanian&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-78", "name": "Kaushik Iyer", "rollNo": "21BCS078", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kaushik%20Iyer&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-79", "name": "Debabrata Murthy", "rollNo": "21BCS079", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Debabrata%20Murthy&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-80", "name": "Satyajit Reddy", "rollNo": "21BCS080", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Satyajit%20Reddy&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673674');
INSERT INTO rooms VALUES('rm-a-403','A-403','blk-a','Block A (Newton)',4,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-81", "name": "Tapas Menon", "rollNo": "21BCS081", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tapas%20Menon&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-82", "name": "Prabir Venkatesh", "rollNo": "21BCS082", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Prabir%20Venkatesh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-83", "name": "Chandan Swaminathan", "rollNo": "21BCS083", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chandan%20Swaminathan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-84", "name": "Shantanu Pillai", "rollNo": "21BCS084", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Shantanu%20Pillai&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673675');
INSERT INTO rooms VALUES('rm-a-404','A-404','blk-a','Block A (Newton)',4,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-85", "name": "Subrata Rao", "rollNo": "21BCS085", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Subrata%20Rao&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-86", "name": "Subir Nambiar", "rollNo": "21BCS086", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Subir%20Nambiar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-87", "name": "Chinmoy Balaji", "rollNo": "21BCS087", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chinmoy%20Balaji&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-88", "name": "Bhabesh Krishnan", "rollNo": "21BCS088", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Bhabesh%20Krishnan&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673675');
INSERT INTO rooms VALUES('rm-a-405','A-405','blk-a','Block A (Newton)',4,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-89", "name": "Pradip Naidu", "rollNo": "21BCS089", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Pradip%20Naidu&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-90", "name": "Monojit Shetty", "rollNo": "21BCS090", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Monojit%20Shetty&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-91", "name": "Dev Banerjee", "rollNo": "21BCS091", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Dev%20Banerjee&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-92", "name": "Chirag Mukherjee", "rollNo": "21BCS092", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chirag%20Mukherjee&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673675');
INSERT INTO rooms VALUES('rm-a-406','A-406','blk-a','Block A (Newton)',4,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-93", "name": "Harshil Chatterjee", "rollNo": "21BCS093", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Harshil%20Chatterjee&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-94", "name": "Parth Roy", "rollNo": "21BCS094", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Parth%20Roy&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-95", "name": "Tanmay Sengupta", "rollNo": "21BCS095", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tanmay%20Sengupta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-96", "name": "Bhavesh Das", "rollNo": "21BCS096", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Bhavesh%20Das&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673676');
INSERT INTO rooms VALUES('rm-a-501','A-501','blk-a','Block A (Newton)',5,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-97", "name": "Omkar Dutta", "rollNo": "21BCS097", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Omkar%20Dutta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-98", "name": "Chinmay Ghosh", "rollNo": "21BCS098", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chinmay%20Ghosh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-99", "name": "Darshan Bhattacharya", "rollNo": "21BCS099", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Darshan%20Bhattacharya&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-100", "name": "Eashan Bose", "rollNo": "21BCS100", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Eashan%20Bose&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673676');
INSERT INTO rooms VALUES('rm-a-502','A-502','blk-a','Block A (Newton)',5,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-101", "name": "Hardik Majumdar", "rollNo": "21BCS101", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Hardik%20Majumdar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-102", "name": "Jaideep Chakraborty", "rollNo": "21BCS102", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Jaideep%20Chakraborty&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-103", "name": "Chetan Ganguly", "rollNo": "21BCS103", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chetan%20Ganguly&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-104", "name": "Hemant Mitra", "rollNo": "21BCS104", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Hemant%20Mitra&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673677');
INSERT INTO rooms VALUES('rm-a-503','A-503','blk-a','Block A (Newton)',5,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-105", "name": "Jitin Saha", "rollNo": "21BCS105", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Jitin%20Saha&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-106", "name": "Kishan Patel", "rollNo": "21BCS106", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kishan%20Patel&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-107", "name": "Manav Dixit", "rollNo": "21BCS107", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Manav%20Dixit&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-108", "name": "Nishant Mehta", "rollNo": "21BCS108", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Nishant%20Mehta&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673677');
INSERT INTO rooms VALUES('rm-a-504','A-504','blk-a','Block A (Newton)',5,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-109", "name": "Vedant Shah", "rollNo": "21BCS109", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vedant%20Shah&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-110", "name": "Yuvraj Kulkarni", "rollNo": "21BCS110", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Yuvraj%20Kulkarni&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-111", "name": "Sachin Joshi", "rollNo": "21BCS111", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sachin%20Joshi&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-112", "name": "Tushar Deshmukh", "rollNo": "21BCS112", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tushar%20Deshmukh&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673678');
INSERT INTO rooms VALUES('rm-a-505','A-505','blk-a','Block A (Newton)',5,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-113", "name": "Akash Marathe", "rollNo": "21BCS113", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Akash%20Marathe&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-114", "name": "Sameer Pawar", "rollNo": "21BCS114", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sameer%20Pawar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-115", "name": "Pankaj Shinde", "rollNo": "21BCS115", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Pankaj%20Shinde&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-116", "name": "Sumit Patil", "rollNo": "21BCS116", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sumit%20Patil&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673678');
INSERT INTO rooms VALUES('rm-a-506','A-506','blk-a','Block A (Newton)',5,'quad',4,4,'occupied','["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]','[{"id": "std-117", "name": "Milind Chavan", "rollNo": "21BCS117", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Milind%20Chavan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-118", "name": "Makarand Gaikwad", "rollNo": "21BCS118", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Makarand%20Gaikwad&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-119", "name": "Sarang Bhosale", "rollNo": "21BCS119", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sarang%20Bhosale&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-120", "name": "Swapnil Deshpande", "rollNo": "21BCS120", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Swapnil%20Deshpande&backgroundColor=0284c7&textColor=ffffff"}]','2026-11-02 17:37:36.673678');
CREATE TABLE allocations (
	id VARCHAR NOT NULL, 
	student_id VARCHAR NOT NULL, 
	room_id VARCHAR NOT NULL, 
	room_number VARCHAR NOT NULL, 
	bed_number VARCHAR NOT NULL, 
	is_active BOOLEAN, 
	allocated_at DATETIME, 
	deallocated_at DATETIME, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(student_id) REFERENCES profiles (id) ON DELETE CASCADE, 
	FOREIGN KEY(room_id) REFERENCES rooms (id) ON DELETE CASCADE
);
INSERT INTO allocations VALUES('alloc-usr-student-1','usr-student-1','rm-a-101','A-101','Bed 1',1,'2026-11-02 17:37:36.667840',NULL,'2026-11-02 17:37:36.667846');
INSERT INTO allocations VALUES('alloc-std-2','std-2','rm-a-101','A-101','Bed 2',1,'2026-11-02 17:37:36.667847',NULL,'2026-11-02 17:37:36.667848');
INSERT INTO allocations VALUES('alloc-std-3','std-3','rm-a-101','A-101','Bed 3',1,'2026-11-02 17:37:36.667849',NULL,'2026-11-02 17:37:36.667850');
INSERT INTO allocations VALUES('alloc-std-4','std-4','rm-a-101','A-101','Bed 4',1,'2026-11-02 17:37:36.667850',NULL,'2026-11-02 17:37:36.667851');
INSERT INTO allocations VALUES('alloc-std-5','std-5','rm-a-102','A-102','Bed 1',1,'2026-11-02 17:37:36.667851',NULL,'2026-11-02 17:37:36.667852');
INSERT INTO allocations VALUES('alloc-std-6','std-6','rm-a-102','A-102','Bed 2',1,'2026-11-02 17:37:36.667852',NULL,'2026-11-02 17:37:36.667853');
INSERT INTO allocations VALUES('alloc-std-7','std-7','rm-a-102','A-102','Bed 3',1,'2026-11-02 17:37:36.667853',NULL,'2026-11-02 17:37:36.667854');
INSERT INTO allocations VALUES('alloc-std-8','std-8','rm-a-102','A-102','Bed 4',1,'2026-11-02 17:37:36.667854',NULL,'2026-11-02 17:37:36.667855');
INSERT INTO allocations VALUES('alloc-std-9','std-9','rm-a-103','A-103','Bed 1',1,'2026-11-02 17:37:36.667855',NULL,'2026-11-02 17:37:36.667855');
INSERT INTO allocations VALUES('alloc-std-10','std-10','rm-a-103','A-103','Bed 2',1,'2026-11-02 17:37:36.667856',NULL,'2026-11-02 17:37:36.667856');
INSERT INTO allocations VALUES('alloc-std-11','std-11','rm-a-103','A-103','Bed 3',1,'2026-11-02 17:37:36.667857',NULL,'2026-11-02 17:37:36.667857');
INSERT INTO allocations VALUES('alloc-std-12','std-12','rm-a-103','A-103','Bed 4',1,'2026-11-02 17:37:36.667858',NULL,'2026-11-02 17:37:36.667858');
INSERT INTO allocations VALUES('alloc-std-13','std-13','rm-a-104','A-104','Bed 1',1,'2026-11-02 17:37:36.667858',NULL,'2026-11-02 17:37:36.667859');
INSERT INTO allocations VALUES('alloc-std-14','std-14','rm-a-104','A-104','Bed 2',1,'2026-11-02 17:37:36.667859',NULL,'2026-11-02 17:37:36.667860');
INSERT INTO allocations VALUES('alloc-std-15','std-15','rm-a-104','A-104','Bed 3',1,'2026-11-02 17:37:36.667860',NULL,'2026-11-02 17:37:36.667861');
INSERT INTO allocations VALUES('alloc-std-16','std-16','rm-a-104','A-104','Bed 4',1,'2026-11-02 17:37:36.667861',NULL,'2026-11-02 17:37:36.667861');
INSERT INTO allocations VALUES('alloc-std-17','std-17','rm-a-105','A-105','Bed 1',1,'2026-11-02 17:37:36.667862',NULL,'2026-11-02 17:37:36.667862');
INSERT INTO allocations VALUES('alloc-std-18','std-18','rm-a-105','A-105','Bed 2',1,'2026-11-02 17:37:36.667863',NULL,'2026-11-02 17:37:36.667863');
INSERT INTO allocations VALUES('alloc-std-19','std-19','rm-a-105','A-105','Bed 3',1,'2026-11-02 17:37:36.667864',NULL,'2026-11-02 17:37:36.667864');
INSERT INTO allocations VALUES('alloc-std-20','std-20','rm-a-105','A-105','Bed 4',1,'2026-11-02 17:37:36.667864',NULL,'2026-11-02 17:37:36.667865');
INSERT INTO allocations VALUES('alloc-std-21','std-21','rm-a-106','A-106','Bed 1',1,'2026-11-02 17:37:36.667865',NULL,'2026-11-02 17:37:36.667866');
INSERT INTO allocations VALUES('alloc-std-22','std-22','rm-a-106','A-106','Bed 2',1,'2026-11-02 17:37:36.667866',NULL,'2026-11-02 17:37:36.667866');
INSERT INTO allocations VALUES('alloc-std-23','std-23','rm-a-106','A-106','Bed 3',1,'2026-11-02 17:37:36.667867',NULL,'2026-11-02 17:37:36.667867');
INSERT INTO allocations VALUES('alloc-std-24','std-24','rm-a-106','A-106','Bed 4',1,'2026-11-02 17:37:36.667868',NULL,'2026-11-02 17:37:36.667868');
INSERT INTO allocations VALUES('alloc-std-25','std-25','rm-a-201','A-201','Bed 1',1,'2026-11-02 17:37:36.667868',NULL,'2026-11-02 17:37:36.667869');
INSERT INTO allocations VALUES('alloc-std-26','std-26','rm-a-201','A-201','Bed 2',1,'2026-11-02 17:37:36.667869',NULL,'2026-11-02 17:37:36.667870');
INSERT INTO allocations VALUES('alloc-std-27','std-27','rm-a-201','A-201','Bed 3',1,'2026-11-02 17:37:36.667870',NULL,'2026-11-02 17:37:36.667871');
INSERT INTO allocations VALUES('alloc-std-28','std-28','rm-a-201','A-201','Bed 4',1,'2026-11-02 17:37:36.667871',NULL,'2026-11-02 17:37:36.667871');
INSERT INTO allocations VALUES('alloc-std-29','std-29','rm-a-202','A-202','Bed 1',1,'2026-11-02 17:37:36.667872',NULL,'2026-11-02 17:37:36.667872');
INSERT INTO allocations VALUES('alloc-std-30','std-30','rm-a-202','A-202','Bed 2',1,'2026-11-02 17:37:36.667873',NULL,'2026-11-02 17:37:36.667873');
INSERT INTO allocations VALUES('alloc-std-31','std-31','rm-a-202','A-202','Bed 3',1,'2026-11-02 17:37:36.667873',NULL,'2026-11-02 17:37:36.667874');
INSERT INTO allocations VALUES('alloc-std-32','std-32','rm-a-202','A-202','Bed 4',1,'2026-11-02 17:37:36.667874',NULL,'2026-11-02 17:37:36.667875');
INSERT INTO allocations VALUES('alloc-std-33','std-33','rm-a-203','A-203','Bed 1',1,'2026-11-02 17:37:36.667875',NULL,'2026-11-02 17:37:36.667875');
INSERT INTO allocations VALUES('alloc-std-34','std-34','rm-a-203','A-203','Bed 2',1,'2026-11-02 17:37:36.667876',NULL,'2026-11-02 17:37:36.667876');
INSERT INTO allocations VALUES('alloc-std-35','std-35','rm-a-203','A-203','Bed 3',1,'2026-11-02 17:37:36.667877',NULL,'2026-11-02 17:37:36.667877');
INSERT INTO allocations VALUES('alloc-std-36','std-36','rm-a-203','A-203','Bed 4',1,'2026-11-02 17:37:36.667880',NULL,'2026-11-02 17:37:36.667881');
INSERT INTO allocations VALUES('alloc-std-37','std-37','rm-a-204','A-204','Bed 1',1,'2026-11-02 17:37:36.667881',NULL,'2026-11-02 17:37:36.667882');
INSERT INTO allocations VALUES('alloc-std-38','std-38','rm-a-204','A-204','Bed 2',1,'2026-11-02 17:37:36.667882',NULL,'2026-11-02 17:37:36.667882');
INSERT INTO allocations VALUES('alloc-std-39','std-39','rm-a-204','A-204','Bed 3',1,'2026-11-02 17:37:36.667883',NULL,'2026-11-02 17:37:36.667883');
INSERT INTO allocations VALUES('alloc-std-40','std-40','rm-a-204','A-204','Bed 4',1,'2026-11-02 17:37:36.667884',NULL,'2026-11-02 17:37:36.667884');
INSERT INTO allocations VALUES('alloc-std-41','std-41','rm-a-205','A-205','Bed 1',1,'2026-11-02 17:37:36.667884',NULL,'2026-11-02 17:37:36.667885');
INSERT INTO allocations VALUES('alloc-std-42','std-42','rm-a-205','A-205','Bed 2',1,'2026-11-02 17:37:36.667885',NULL,'2026-11-02 17:37:36.667886');
INSERT INTO allocations VALUES('alloc-std-43','std-43','rm-a-205','A-205','Bed 3',1,'2026-11-02 17:37:36.667886',NULL,'2026-11-02 17:37:36.667886');
INSERT INTO allocations VALUES('alloc-std-44','std-44','rm-a-205','A-205','Bed 4',1,'2026-11-02 17:37:36.667887',NULL,'2026-11-02 17:37:36.667887');
INSERT INTO allocations VALUES('alloc-std-45','std-45','rm-a-206','A-206','Bed 1',1,'2026-11-02 17:37:36.667888',NULL,'2026-11-02 17:37:36.667888');
INSERT INTO allocations VALUES('alloc-std-46','std-46','rm-a-206','A-206','Bed 2',1,'2026-11-02 17:37:36.667889',NULL,'2026-11-02 17:37:36.667889');
INSERT INTO allocations VALUES('alloc-std-47','std-47','rm-a-206','A-206','Bed 3',1,'2026-11-02 17:37:36.667889',NULL,'2026-11-02 17:37:36.667890');
INSERT INTO allocations VALUES('alloc-std-48','std-48','rm-a-206','A-206','Bed 4',1,'2026-11-02 17:37:36.667890',NULL,'2026-11-02 17:37:36.667891');
INSERT INTO allocations VALUES('alloc-std-49','std-49','rm-a-301','A-301','Bed 1',1,'2026-11-02 17:37:36.667891',NULL,'2026-11-02 17:37:36.667891');
INSERT INTO allocations VALUES('alloc-std-50','std-50','rm-a-301','A-301','Bed 2',1,'2026-11-02 17:37:36.667892',NULL,'2026-11-02 17:37:36.667892');
INSERT INTO allocations VALUES('alloc-std-51','std-51','rm-a-301','A-301','Bed 3',1,'2026-11-02 17:37:36.667893',NULL,'2026-11-02 17:37:36.667893');
INSERT INTO allocations VALUES('alloc-std-52','std-52','rm-a-301','A-301','Bed 4',1,'2026-11-02 17:37:36.667893',NULL,'2026-11-02 17:37:36.667894');
INSERT INTO allocations VALUES('alloc-std-53','std-53','rm-a-302','A-302','Bed 1',1,'2026-11-02 17:37:36.667894',NULL,'2026-11-02 17:37:36.667895');
INSERT INTO allocations VALUES('alloc-std-54','std-54','rm-a-302','A-302','Bed 2',1,'2026-11-02 17:37:36.667895',NULL,'2026-11-02 17:37:36.667896');
INSERT INTO allocations VALUES('alloc-std-55','std-55','rm-a-302','A-302','Bed 3',1,'2026-11-02 17:37:36.667896',NULL,'2026-11-02 17:37:36.667896');
INSERT INTO allocations VALUES('alloc-std-56','std-56','rm-a-302','A-302','Bed 4',1,'2026-11-02 17:37:36.667897',NULL,'2026-11-02 17:37:36.667897');
INSERT INTO allocations VALUES('alloc-std-57','std-57','rm-a-303','A-303','Bed 1',1,'2026-11-02 17:37:36.667898',NULL,'2026-11-02 17:37:36.667898');
INSERT INTO allocations VALUES('alloc-std-58','std-58','rm-a-303','A-303','Bed 2',1,'2026-11-02 17:37:36.667899',NULL,'2026-11-02 17:37:36.667899');
INSERT INTO allocations VALUES('alloc-std-59','std-59','rm-a-303','A-303','Bed 3',1,'2026-11-02 17:37:36.667899',NULL,'2026-11-02 17:37:36.667900');
INSERT INTO allocations VALUES('alloc-std-60','std-60','rm-a-303','A-303','Bed 4',1,'2026-11-02 17:37:36.667900',NULL,'2026-11-02 17:37:36.667901');
INSERT INTO allocations VALUES('alloc-std-61','std-61','rm-a-304','A-304','Bed 1',1,'2026-11-02 17:37:36.667901',NULL,'2026-11-02 17:37:36.667902');
INSERT INTO allocations VALUES('alloc-std-62','std-62','rm-a-304','A-304','Bed 2',1,'2026-11-02 17:37:36.667902',NULL,'2026-11-02 17:37:36.667902');
INSERT INTO allocations VALUES('alloc-std-63','std-63','rm-a-304','A-304','Bed 3',1,'2026-11-02 17:37:36.667903',NULL,'2026-11-02 17:37:36.667903');
INSERT INTO allocations VALUES('alloc-std-64','std-64','rm-a-304','A-304','Bed 4',1,'2026-11-02 17:37:36.667904',NULL,'2026-11-02 17:37:36.667904');
INSERT INTO allocations VALUES('alloc-std-65','std-65','rm-a-305','A-305','Bed 1',1,'2026-11-02 17:37:36.667904',NULL,'2026-11-02 17:37:36.667905');
INSERT INTO allocations VALUES('alloc-std-66','std-66','rm-a-305','A-305','Bed 2',1,'2026-11-02 17:37:36.667905',NULL,'2026-11-02 17:37:36.667906');
INSERT INTO allocations VALUES('alloc-std-67','std-67','rm-a-305','A-305','Bed 3',1,'2026-11-02 17:37:36.667906',NULL,'2026-11-02 17:37:36.667906');
INSERT INTO allocations VALUES('alloc-std-68','std-68','rm-a-305','A-305','Bed 4',1,'2026-11-02 17:37:36.667907',NULL,'2026-11-02 17:37:36.667907');
INSERT INTO allocations VALUES('alloc-std-69','std-69','rm-a-306','A-306','Bed 1',1,'2026-11-02 17:37:36.667907',NULL,'2026-11-02 17:37:36.667908');
INSERT INTO allocations VALUES('alloc-std-70','std-70','rm-a-306','A-306','Bed 2',1,'2026-11-02 17:37:36.667908',NULL,'2026-11-02 17:37:36.667909');
INSERT INTO allocations VALUES('alloc-std-71','std-71','rm-a-306','A-306','Bed 3',1,'2026-11-02 17:37:36.667909',NULL,'2026-11-02 17:37:36.667909');
INSERT INTO allocations VALUES('alloc-std-72','std-72','rm-a-306','A-306','Bed 4',1,'2026-11-02 17:37:36.667910',NULL,'2026-11-02 17:37:36.667910');
INSERT INTO allocations VALUES('alloc-std-73','std-73','rm-a-401','A-401','Bed 1',1,'2026-11-02 17:37:36.667911',NULL,'2026-11-02 17:37:36.667911');
INSERT INTO allocations VALUES('alloc-std-74','std-74','rm-a-401','A-401','Bed 2',1,'2026-11-02 17:37:36.667912',NULL,'2026-11-02 17:37:36.667912');
INSERT INTO allocations VALUES('alloc-std-75','std-75','rm-a-401','A-401','Bed 3',1,'2026-11-02 17:37:36.667912',NULL,'2026-11-02 17:37:36.667913');
INSERT INTO allocations VALUES('alloc-std-76','std-76','rm-a-401','A-401','Bed 4',1,'2026-11-02 17:37:36.667913',NULL,'2026-11-02 17:37:36.667913');
INSERT INTO allocations VALUES('alloc-std-77','std-77','rm-a-402','A-402','Bed 1',1,'2026-11-02 17:37:36.667914',NULL,'2026-11-02 17:37:36.667914');
INSERT INTO allocations VALUES('alloc-std-78','std-78','rm-a-402','A-402','Bed 2',1,'2026-11-02 17:37:36.667915',NULL,'2026-11-02 17:37:36.667915');
INSERT INTO allocations VALUES('alloc-std-79','std-79','rm-a-402','A-402','Bed 3',1,'2026-11-02 17:37:36.667916',NULL,'2026-11-02 17:37:36.667916');
INSERT INTO allocations VALUES('alloc-std-80','std-80','rm-a-402','A-402','Bed 4',1,'2026-11-02 17:37:36.667916',NULL,'2026-11-02 17:37:36.667917');
INSERT INTO allocations VALUES('alloc-std-81','std-81','rm-a-403','A-403','Bed 1',1,'2026-11-02 17:37:36.667917',NULL,'2026-11-02 17:37:36.667917');
INSERT INTO allocations VALUES('alloc-std-82','std-82','rm-a-403','A-403','Bed 2',1,'2026-11-02 17:37:36.667918',NULL,'2026-11-02 17:37:36.667918');
INSERT INTO allocations VALUES('alloc-std-83','std-83','rm-a-403','A-403','Bed 3',1,'2026-11-02 17:37:36.667919',NULL,'2026-11-02 17:37:36.667919');
INSERT INTO allocations VALUES('alloc-std-84','std-84','rm-a-403','A-403','Bed 4',1,'2026-11-02 17:37:36.667919',NULL,'2026-11-02 17:37:36.667920');
INSERT INTO allocations VALUES('alloc-std-85','std-85','rm-a-404','A-404','Bed 1',1,'2026-11-02 17:37:36.667920',NULL,'2026-11-02 17:37:36.667921');
INSERT INTO allocations VALUES('alloc-std-86','std-86','rm-a-404','A-404','Bed 2',1,'2026-11-02 17:37:36.667921',NULL,'2026-11-02 17:37:36.667921');
INSERT INTO allocations VALUES('alloc-std-87','std-87','rm-a-404','A-404','Bed 3',1,'2026-11-02 17:37:36.667922',NULL,'2026-11-02 17:37:36.667922');
INSERT INTO allocations VALUES('alloc-std-88','std-88','rm-a-404','A-404','Bed 4',1,'2026-11-02 17:37:36.667923',NULL,'2026-11-02 17:37:36.667923');
INSERT INTO allocations VALUES('alloc-std-89','std-89','rm-a-405','A-405','Bed 1',1,'2026-11-02 17:37:36.667923',NULL,'2026-11-02 17:37:36.667924');
INSERT INTO allocations VALUES('alloc-std-90','std-90','rm-a-405','A-405','Bed 2',1,'2026-11-02 17:37:36.667924',NULL,'2026-11-02 17:37:36.667925');
INSERT INTO allocations VALUES('alloc-std-91','std-91','rm-a-405','A-405','Bed 3',1,'2026-11-02 17:37:36.667925',NULL,'2026-11-02 17:37:36.667925');
INSERT INTO allocations VALUES('alloc-std-92','std-92','rm-a-405','A-405','Bed 4',1,'2026-11-02 17:37:36.667926',NULL,'2026-11-02 17:37:36.667926');
INSERT INTO allocations VALUES('alloc-std-93','std-93','rm-a-406','A-406','Bed 1',1,'2026-11-02 17:37:36.667927',NULL,'2026-11-02 17:37:36.667927');
INSERT INTO allocations VALUES('alloc-std-94','std-94','rm-a-406','A-406','Bed 2',1,'2026-11-02 17:37:36.667927',NULL,'2026-11-02 17:37:36.667928');
INSERT INTO allocations VALUES('alloc-std-95','std-95','rm-a-406','A-406','Bed 3',1,'2026-11-02 17:37:36.667928',NULL,'2026-11-02 17:37:36.667928');
INSERT INTO allocations VALUES('alloc-std-96','std-96','rm-a-406','A-406','Bed 4',1,'2026-11-02 17:37:36.667929',NULL,'2026-11-02 17:37:36.667929');
INSERT INTO allocations VALUES('alloc-std-97','std-97','rm-a-501','A-501','Bed 1',1,'2026-11-02 17:37:36.667930',NULL,'2026-11-02 17:37:36.667930');
INSERT INTO allocations VALUES('alloc-std-98','std-98','rm-a-501','A-501','Bed 2',1,'2026-11-02 17:37:36.667930',NULL,'2026-11-02 17:37:36.667931');
INSERT INTO allocations VALUES('alloc-std-99','std-99','rm-a-501','A-501','Bed 3',1,'2026-11-02 17:37:36.667931',NULL,'2026-11-02 17:37:36.667932');
INSERT INTO allocations VALUES('alloc-std-100','std-100','rm-a-501','A-501','Bed 4',1,'2026-11-02 17:37:36.667932',NULL,'2026-11-02 17:37:36.667932');
INSERT INTO allocations VALUES('alloc-std-101','std-101','rm-a-502','A-502','Bed 1',1,'2026-11-02 17:37:36.667933',NULL,'2026-11-02 17:37:36.667933');
INSERT INTO allocations VALUES('alloc-std-102','std-102','rm-a-502','A-502','Bed 2',1,'2026-11-02 17:37:36.667934',NULL,'2026-11-02 17:37:36.667934');
INSERT INTO allocations VALUES('alloc-std-103','std-103','rm-a-502','A-502','Bed 3',1,'2026-11-02 17:37:36.667935',NULL,'2026-11-02 17:37:36.667935');
INSERT INTO allocations VALUES('alloc-std-104','std-104','rm-a-502','A-502','Bed 4',1,'2026-11-02 17:37:36.667935',NULL,'2026-11-02 17:37:36.667936');
INSERT INTO allocations VALUES('alloc-std-105','std-105','rm-a-503','A-503','Bed 1',1,'2026-11-02 17:37:36.667936',NULL,'2026-11-02 17:37:36.667937');
INSERT INTO allocations VALUES('alloc-std-106','std-106','rm-a-503','A-503','Bed 2',1,'2026-11-02 17:37:36.667937',NULL,'2026-11-02 17:37:36.667937');
INSERT INTO allocations VALUES('alloc-std-107','std-107','rm-a-503','A-503','Bed 3',1,'2026-11-02 17:37:36.667938',NULL,'2026-11-02 17:37:36.667938');
INSERT INTO allocations VALUES('alloc-std-108','std-108','rm-a-503','A-503','Bed 4',1,'2026-11-02 17:37:36.667939',NULL,'2026-11-02 17:37:36.667939');
INSERT INTO allocations VALUES('alloc-std-109','std-109','rm-a-504','A-504','Bed 1',1,'2026-11-02 17:37:36.667940',NULL,'2026-11-02 17:37:36.667940');
INSERT INTO allocations VALUES('alloc-std-110','std-110','rm-a-504','A-504','Bed 2',1,'2026-11-02 17:37:36.667940',NULL,'2026-11-02 17:37:36.667941');
INSERT INTO allocations VALUES('alloc-std-111','std-111','rm-a-504','A-504','Bed 3',1,'2026-11-02 17:37:36.667941',NULL,'2026-11-02 17:37:36.667942');
INSERT INTO allocations VALUES('alloc-std-112','std-112','rm-a-504','A-504','Bed 4',1,'2026-11-02 17:37:36.667942',NULL,'2026-11-02 17:37:36.667942');
INSERT INTO allocations VALUES('alloc-std-113','std-113','rm-a-505','A-505','Bed 1',1,'2026-11-02 17:37:36.667943',NULL,'2026-11-02 17:37:36.667943');
INSERT INTO allocations VALUES('alloc-std-114','std-114','rm-a-505','A-505','Bed 2',1,'2026-11-02 17:37:36.667944',NULL,'2026-11-02 17:37:36.667944');
INSERT INTO allocations VALUES('alloc-std-115','std-115','rm-a-505','A-505','Bed 3',1,'2026-11-02 17:37:36.667944',NULL,'2026-11-02 17:37:36.667945');
INSERT INTO allocations VALUES('alloc-std-116','std-116','rm-a-505','A-505','Bed 4',1,'2026-11-02 17:37:36.667945',NULL,'2026-11-02 17:37:36.667946');
INSERT INTO allocations VALUES('alloc-std-117','std-117','rm-a-506','A-506','Bed 1',1,'2026-11-02 17:37:36.667946',NULL,'2026-11-02 17:37:36.667946');
INSERT INTO allocations VALUES('alloc-std-118','std-118','rm-a-506','A-506','Bed 2',1,'2026-11-02 17:37:36.667947',NULL,'2026-11-02 17:37:36.667947');
INSERT INTO allocations VALUES('alloc-std-119','std-119','rm-a-506','A-506','Bed 3',1,'2026-11-02 17:37:36.667948',NULL,'2026-11-02 17:37:36.667948');
INSERT INTO allocations VALUES('alloc-std-120','std-120','rm-a-506','A-506','Bed 4',1,'2026-11-02 17:37:36.667948',NULL,'2026-11-02 17:37:36.667949');
CREATE INDEX ix_visitors_phone ON visitors (phone);
CREATE INDEX ix_visitors_status ON visitors (status);
CREATE INDEX ix_visitors_host_student_id ON visitors (host_student_id);
CREATE INDEX ix_visitors_name ON visitors (name);
CREATE INDEX ix_visitor_passes_visitor_id ON visitor_passes (visitor_id);
CREATE UNIQUE INDEX ix_visitor_passes_pass_code ON visitor_passes (pass_code);
CREATE INDEX ix_visitor_events_visitor_id ON visitor_events (visitor_id);
CREATE INDEX ix_assets_name ON assets (name);
CREATE INDEX ix_assets_status ON assets (status);
CREATE INDEX ix_assets_block ON assets (block);
CREATE UNIQUE INDEX ix_assets_asset_tag ON assets (asset_tag);
CREATE INDEX ix_assets_room_number ON assets (room_number);
CREATE INDEX ix_asset_movements_asset_id ON asset_movements (asset_id);
CREATE INDEX ix_asset_damage_reports_maintenance_ticket_id ON asset_damage_reports (maintenance_ticket_id);
CREATE INDEX ix_asset_damage_reports_asset_id ON asset_damage_reports (asset_id);
CREATE INDEX ix_inventory_transactions_item_id ON inventory_transactions (item_id);
CREATE INDEX ix_parcels_status ON parcels (status);
CREATE INDEX ix_parcels_recipient_student_id ON parcels (recipient_student_id);
CREATE UNIQUE INDEX ix_parcels_parcel_ref ON parcels (parcel_ref);
CREATE INDEX ix_parcels_locker_number ON parcels (locker_number);
CREATE INDEX ix_parcel_pickup_codes_code ON parcel_pickup_codes (code);
CREATE INDEX ix_parcel_pickup_codes_parcel_id ON parcel_pickup_codes (parcel_id);
CREATE INDEX ix_parcel_events_parcel_id ON parcel_events (parcel_id);
CREATE INDEX ix_laundry_slots_slot_date ON laundry_slots (slot_date);
CREATE INDEX ix_laundry_orders_student_id ON laundry_orders (student_id);
CREATE INDEX ix_laundry_orders_status ON laundry_orders (status);
CREATE UNIQUE INDEX ix_laundry_orders_order_ref ON laundry_orders (order_ref);
CREATE INDEX ix_laundry_order_items_order_id ON laundry_order_items (order_id);
CREATE INDEX ix_laundry_status_events_order_id ON laundry_status_events (order_id);
CREATE INDEX ix_inspection_template_items_template_id ON inspection_template_items (template_id);
CREATE INDEX ix_inspections_block ON inspections (block);
CREATE INDEX ix_inspections_room_number ON inspections (room_number);
CREATE UNIQUE INDEX ix_inspections_inspection_ref ON inspections (inspection_ref);
CREATE INDEX ix_inspections_status ON inspections (status);
CREATE INDEX ix_inspection_results_inspection_id ON inspection_results (inspection_id);
CREATE INDEX ix_corrective_actions_inspection_id ON corrective_actions (inspection_id);
CREATE INDEX ix_profiles_role ON profiles (role);
CREATE INDEX ix_profiles_room_number ON profiles (room_number);
CREATE INDEX ix_profiles_full_name ON profiles (full_name);
CREATE INDEX ix_profiles_roll_no ON profiles (roll_no);
CREATE INDEX ix_rooms_number ON rooms (number);
CREATE INDEX ix_rooms_floor ON rooms (floor);
CREATE INDEX ix_allocations_student_id ON allocations (student_id);
CREATE UNIQUE INDEX idx_allocations_active_student ON allocations (student_id) WHERE is_active = 1;
CREATE UNIQUE INDEX idx_allocations_active_bed ON allocations (room_number, bed_number) WHERE is_active = 1;
CREATE INDEX ix_allocations_is_active ON allocations (is_active);
COMMIT;
