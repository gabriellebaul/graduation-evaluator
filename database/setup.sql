/* Please run this script to set up the database schema and populate it with sample data */

/* Table Creation */

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL
);

CREATE TABLE course_prerequisites (
    course_code VARCHAR(20) NOT NULL,
    prerequisite_code VARCHAR(20) NOT NULL,

    PRIMARY KEY (course_code, prerequisite_code),

    FOREIGN KEY (course_code)
        REFERENCES courses(code),

    FOREIGN KEY (prerequisite_code)
        REFERENCES courses(code)
);

CREATE TABLE student_courses (
    student_id INTEGER NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('completed', 'in_progress')),

    PRIMARY KEY (student_id, course_code),

    FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    FOREIGN KEY (course_code)
        REFERENCES courses(code)
);

CREATE TABLE degrees (
    degree_code VARCHAR(20) PRIMARY KEY,
    degree_name VARCHAR(100) NOT NULL
);

CREATE TABLE degree_required_courses (
    degree_code VARCHAR(20) NOT NULL,
    course_code VARCHAR(20) NOT NULL,

    PRIMARY KEY (degree_code, course_code),

    FOREIGN KEY (degree_code)
        REFERENCES degrees(degree_code),

    FOREIGN KEY (course_code)
        REFERENCES courses(code)
);


/* Sample Data */

INSERT INTO students (student_id, name) VALUES
(1001, 'Harry Potter'),
(1002, 'Hermione Granger'),
(1003, 'Ron Weasley'),
(1004, 'Draco Malfoy'),
(1005, 'Luna Lovegood');

INSERT INTO courses (code, name, credits) VALUES
('DADA101', 'Defence Against the Dark Arts I', 3),
('DADA201', 'Advanced Defence Against the Dark Arts', 3),
('POT101', 'Introduction to Potions', 3),
('POT201', 'Advanced Potions', 3),
('CHAR101', 'Charms', 3),
('TRANS101', 'Transfiguration', 3),
('HERB101', 'Herbology', 3),
('ASTRO101', 'Astronomy', 3),
('HIST101', 'History of Magic', 3),
('CARE101', 'Care of Magical Creatures', 3),
('HEAL201', 'Magical Healing', 3);

INSERT INTO course_prerequisites
(course_code, prerequisite_code) VALUES
('DADA201', 'DADA101'),
('POT201', 'POT101'),
('HEAL201', 'POT101'),
('HEAL201', 'HERB101');

INSERT INTO degrees (degree_code, degree_name) VALUES
('AUROR', 'Auror Training'),
('HEALER', 'Magical Healing'),
('MAGIZ', 'Magizoology');

INSERT INTO degree_required_courses
(degree_code, course_code) VALUES

('AUROR', 'DADA101'),
('AUROR', 'DADA201'),
('AUROR', 'CHAR101'),
('AUROR', 'TRANS101'),
('AUROR', 'POT101'),

('HEALER', 'POT101'),
('HEALER', 'POT201'),
('HEALER', 'HERB101'),
('HEALER', 'HEAL201'),
('HEALER', 'TRANS101'),

('MAGIZ', 'CARE101'),
('MAGIZ', 'HERB101'),
('MAGIZ', 'ASTRO101'),
('MAGIZ', 'CHAR101'),
('MAGIZ', 'TRANS101');

INSERT INTO student_courses
(student_id, course_code, status) VALUES

(1001, 'DADA101', 'completed'),
(1001, 'CHAR101', 'completed'),
(1001, 'TRANS101', 'completed'),
(1001, 'POT101', 'in_progress'),
(1001, 'DADA201', 'in_progress'),

(1002, 'DADA101', 'completed'),
(1002, 'CHAR101', 'completed'),
(1002, 'TRANS101', 'completed'),
(1002, 'POT101', 'completed'),
(1002, 'POT201', 'completed'),
(1002, 'HERB101', 'completed'),
(1002, 'HEAL201', 'in_progress'),

(1003, 'DADA101', 'completed'),
(1003, 'CHAR101', 'completed'),
(1003, 'ASTRO101', 'completed'),
(1003, 'POT101', 'in_progress'),

(1004, 'DADA101', 'completed'),
(1004, 'POT101', 'completed'),
(1004, 'CHAR101', 'completed'),
(1004, 'TRANS101', 'in_progress'),

(1005, 'CARE101', 'completed'),
(1005, 'HERB101', 'completed'),
(1005, 'ASTRO101', 'completed'),
(1005, 'CHAR101', 'in_progress');