const express = require("express");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = process.env.port || 3000;

// Allow Express to read JSON request bodies.
app.use(express.json());

// Serve the frontend files from the public folder.
app.use(express.static(path.join(__dirname, "../public")));



app.get("/api/courses", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.code,
                c.name,
                c.credits,
                COALESCE(
                    ARRAY_AGG(cp.prerequisite_code)
                        FILTER (
                            WHERE cp.prerequisite_code IS NOT NULL
                        ),
                    ARRAY[]::VARCHAR[]
                ) AS prerequisites
            FROM courses c
            LEFT JOIN course_prerequisites cp
                ON cp.course_code = c.code
            GROUP BY c.code, c.name, c.credits
            ORDER BY c.code;
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Failed to retrieve courses:", error);
        res.status(500).json({
            error: "Failed to retrieve courses"
        });
    }
});

app.get("/api/degrees", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT degree_code, degree_name
            FROM degrees
            ORDER BY degree_name
        `);

        res.json(result.rows);
        
    } catch (error) {
        console.error("Error loading degrees:", error.message);
        res.status(500).json({ error: "Failed to retrieve degrees" });
    }
});

app.get("/api/students", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT student_id, name
            FROM students
            ORDER BY student_id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error loading students:", error.message);
        res.status(500).json({ error: "Failed to retrieve students" });
    }
});

app.get("/api/degrees/:degreeCode/evaluation", async (req, res) => {
    try {
        const { degreeCode } = req.params;

        const result = await pool.query(`
            SELECT
                c.code,
                c.name,
                c.credits,
                COALESCE(
                    (
                        SELECT array_agg(cp.prerequisite_code
                                         ORDER BY cp.prerequisite_code)
                        FROM course_prerequisites cp
                        WHERE cp.course_code = c.code
                    ),
                    ARRAY[]::varchar[]
                ) AS prerequisites,
                CASE
                    WHEN sc.status = 'completed' THEN 'completed'
                    WHEN sc.status = 'in_progress' THEN 'in_progress'
                    ELSE 'not_taken'
                END AS status
            FROM degree_required_courses drc
            JOIN courses c
                ON c.code = drc.course_code
            LEFT JOIN student_courses sc
                ON sc.course_code = c.code
                AND sc.student_id = $2
            WHERE drc.degree_code = $1
            ORDER BY c.code
        `, [degreeCode, Number(req.query.studentId)]);

        if (result.rows.length === 0) {
            const degree = await pool.query(
                "SELECT degree_code FROM degrees WHERE degree_code = $1",
                [degreeCode]
            );

            if (degree.rows.length === 0) {
                return res.status(404).json({ error: "Degree not found" });
            }
        }

        res.json(result.rows);
    } catch (error) {
        console.error("Error loading evaluation:", error.message);
        res.status(500).json({ error: "Failed to retrieve evaluation" });
    }
});

app.get("/api/students/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        if (!Number.isInteger(studentId) || studentId < 1) {
            return res.status(400).json({ error: "Invalid student ID" });
        }

        const result = await pool.query(
            `SELECT student_id, name
            FROM students
            WHERE student_id = $1`,
            [studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error verifying student:", error.message);
        res.status(500).json({ error: "Failed to verify student" });
    }
});

app.post("/api/students/:studentId/courses", async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const { courseCode, degreeCode } = req.body;

    if (!Number.isInteger(studentId) || studentId < 1) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    // Check that the student exists
    const student = await pool.query(
      "SELECT student_id FROM students WHERE student_id = $1",
      [studentId]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Only allow courses required for the selected degree
    const requiredCourse = await pool.query(
      `SELECT course_code
       FROM degree_required_courses
       WHERE degree_code = $1 AND course_code = $2`,
      [degreeCode, courseCode]
    );

    if (requiredCourse.rows.length === 0) {
      return res.status(400).json({
        error: "This course is not required for the selected degree."
      });
    }

    // Add the course as in progress
    const result = await pool.query(
      `INSERT INTO student_courses (student_id, course_code, status)
       VALUES ($1, $2, 'in_progress')
       ON CONFLICT (student_id, course_code) DO NOTHING
       RETURNING *`,
      [studentId, courseCode]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: "This course already exists in your course history."
      });
    }

    res.status(201).json({
      message: "Course added successfully."
    });

  } catch (error) {
    console.error("Error adding course:", error.message);
    res.status(500).json({ error: "Failed to add course." });
  }
});

app.delete(
  "/api/students/:studentId/courses/:courseCode",
  async (req, res) => {
    try {
      const studentId = Number(req.params.studentId);
      const courseCode = req.params.courseCode;

      if (!Number.isInteger(studentId) || studentId < 1) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      // Delete only if the course is currently in progress
      const result = await pool.query(
        `DELETE FROM student_courses
         WHERE student_id = $1
           AND course_code = $2
           AND status = 'in_progress'
         RETURNING *`,
        [studentId, courseCode]
      );

      if (result.rows.length === 0) {
        return res.status(409).json({
          error: "You can only drop courses that are currently in progress."
        });
      }

      res.json({ message: "Course dropped successfully." });

    } catch (error) {
      console.error("Error dropping course:", error.message);
      res.status(500).json({ error: "Failed to drop course." });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});

