const studentSection = document.getElementById("student-section");
const studentIdInput = document.getElementById("student-id");
const continueButton = document.getElementById("continue-button");
const degreeSection = document.getElementById("degree-section");
const degreeSelect = document.getElementById("degree-select");
const message = document.getElementById("message");
const idMessage = document.getElementById("id-message");
const evaluationSection = document.getElementById("evaluation-section");
const degreeTitle = document.getElementById("degree-title");
const evaluationBody = document.getElementById("evaluation-body");
const studentTable = document.getElementById("student-table");
const studentTableBody = document.getElementById("student-table-body");
const currentStudentDisplay = document.getElementById("current-student");

var currentStudentId = null;

// Populates the table of students from the database 
async function loadStudents() {
    try {
        const response = await fetch("/api/students");
        const students = await response.json();

        studentTableBody.innerHTML = "";

        students.forEach((student) => {
            
            const row = document.createElement("tr");

            addCell(row, student.student_id);
            addCell(row, student.name);

            studentTableBody.appendChild(row);

        });

    } 
    catch (error) {
        console.error(error);
        message.textContent = "Could not load degrees, server error.";
    }
}

// Populates the dropdown with degrees offered based on the database
async function loadDegrees() {
    try {
        const response = await fetch("/api/degrees");
        const degrees = await response.json();
        degreeSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose a degree...";
        degreeSelect.appendChild(placeholder);

        degrees.forEach((degree) => {
            const option = document.createElement("option");
            option.value = degree.degree_code;
            option.textContent = degree.degree_name;
            degreeSelect.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        message.textContent = "Could not load degrees, server error.";
    }
}

// Checks if the student ID entered by the user is valid and exists in the database, then calls LoadDegrees() to populate the dropdown
async function verifyStudent() {
    const studentId = studentIdInput.value.trim();

    if (!/^[1-9]\d*$/.test(studentId)) {
        idMessage.textContent = "Please enter a valid 4-digit student ID.";
        return;
    }


    try {
        const response = await fetch(
            `/api/students/${encodeURIComponent(studentId)}`
        );

        if (response.status === 404) {
            idMessage.textContent = "Student ID not found. Please check and try again.";
            return;
        }

        if (!response.ok) throw new Error("Could not verify student ID.");

            const student = await response.json();
            currentStudentId = student.student_id;
            currentStudentName = student.name

            await loadDegrees();

            currentStudentDisplay.textContent = `Student: ${currentStudentName} - ${currentStudentId}`;

            studentSection.hidden = true;
            degreeSection.hidden = false;
            evaluationSection.hidden = true;

            idMessage.textContent = `Welcome, ${student.name}! Choose a degree to evaluate.`;
            return;
        await loadDegrees();

        studentSection.hidden = true;
        degreeSection.hidden = false;
        evaluationSection.hidden = true;
        
    } catch (error) {
        console.error(error);
        message.textContent = "Could not verify student ID. Please try again.";
    } finally {
        continueButton.disabled = false;
    }
}

// Loads the required courses of the selected degree for the current student and their status in completing them
async function loadEvaluation(degreeCode) {
    evaluationSection.hidden = true;
    evaluationBody.replaceChildren();

    if (!degreeCode) {
        message.textContent = "Select a degree to view its required courses.";
        return;
    }

    try {
        const response = await fetch(
            `/api/degrees/${degreeCode}/evaluation?studentId=${currentStudentId}`
        );

        if (!response.ok) {
            throw new Error("Could not load the evaluation.");
        }

        const courses = await response.json();
        degreeTitle.textContent = degreeSelect.selectedOptions[0].textContent;

        var completed = 0;
        var inProgress = 0;
        var notTaken = 0;

        courses.forEach((course) => {
            // Evaluation summary counters
            if (course.status === "completed") completed++;
            else if (course.status === "in_progress") inProgress++;
            else notTaken++;
            
            // Row creation for each course
            const row = document.createElement("tr");

            addCell(row, course.code);
            addCell(row, course.name);
            addCell(row, course.credits);

            // Display the prerequisites or "None" if there are no prerequisites
            addCell(row, course.prerequisites.length ? course.prerequisites.join(", ") : "None");

            // Display the status of the course (completed, in progress, or not taken)
            const statusCell = document.createElement("td");
            const statusLabel = document.createElement("span");
            statusLabel.className = `status status-${course.status}`;
            statusLabel.textContent = formatStatus(course.status);
            statusCell.appendChild(statusLabel);
            row.appendChild(statusCell);

            
            // Display the actions column (lets students add a course they have not taken or drop a course they are currently taking)
            const actionCell = document.createElement("td");
            const actionButton = document.createElement("button");

            if (course.status === "not_taken") {
            actionButton.textContent = "Add Course";
            actionButton.className = "add-button";
            actionButton.dataset.action = "add";

            } else if (course.status === "in_progress") {
            actionButton.textContent = "Drop Course";
            actionButton.className = "drop-button";
            actionButton.dataset.action = "drop";

            } else {
            actionButton.textContent = "—";
            actionButton.disabled = true;
            }

            actionButton.dataset.courseCode = course.code;

            actionCell.appendChild(actionButton);
            row.appendChild(actionCell);
            evaluationBody.appendChild(row);
        });

        //Displaying evaluation summary
        document.getElementById("total-count").textContent = courses.length;
        document.getElementById("completed-count").textContent = completed;
        document.getElementById("progress-count").textContent = inProgress;
        document.getElementById("not-taken-count").textContent = notTaken;

        evaluationSection.hidden = false;

        message.textContent = `Showing ${courses.length} required courses to complete ${degreeTitle.textContent}.`;
    } catch (error) {
        console.error(error);
        message.textContent = "Could not load the evaluation. Please try again.";
    }
}

// Helper function to add a cell to a row
function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}

// Helper function to format the status for display
function formatStatus(status) {
    const labels = {
        completed: "Completed",
        in_progress: "In progress",
        not_taken: "Not taken"
    };

    return labels[status];
}

continueButton.addEventListener("click", verifyStudent);

studentIdInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        verifyStudent();
    }
});

degreeSelect.addEventListener("change", () => {
    loadEvaluation(degreeSelect.value);
});

// Action button listeners
evaluationBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const action = button.dataset.action;
  const courseCode = button.dataset.courseCode;

  // Confirmation before dropping a course
  if (action === "drop") {
    const confirmed = window.confirm(
      `Are you sure you want to drop ${courseCode}?`
    );

    if (!confirmed) return;
  }

  button.disabled = true;

  try {
    var response;

    if (action === "add") {
      response = await fetch(
        `/api/students/${currentStudentId}/courses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            courseCode,
            degreeCode: degreeSelect.value
          })
        }
      );

    } else if (action === "drop") {
      response = await fetch(
        `/api/students/${currentStudentId}/courses/${encodeURIComponent(courseCode)}`,
        {
          method: "DELETE"
        }
      );
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

    message.textContent = result.message;

    // Refresh the evaluation to show the updated status
    await loadEvaluation(degreeSelect.value);

  } catch (error) {
    console.error(error);
    message.textContent = error.message;

  } finally {
    button.disabled = false;
  }
});

// Populates students' info table on page load
document.addEventListener("DOMContentLoaded", () => {
    loadStudents();
});