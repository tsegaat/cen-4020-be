// app.js
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Authentication routes

// Route: POST /api/login
// Description: Authenticates a user with a username and password.
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                Student: true,
                Instructor: true,
                Advisor: true,
                Staff: true,
            },
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // In production, you should use proper authentication (JWT, sessions, etc.)
        res.json({
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
});

// Route: GET /api/user/:id
// Description: Retrieves a user by ID.
app.get("/api/user/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: {
                Student: {
                    include: {
                        enrollments: {
                            include: {
                                course: true,
                            },
                        },
                    },
                },
                Instructor: {
                    include: {
                        courses: true,
                    },
                },
                Advisor: {
                    include: {
                        students: {
                            include: {
                                user: true,
                                enrollments: {
                                    include: {
                                        course: true,
                                    },
                                },
                            },
                        },
                    },
                },
                Staff: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Student routes

// const [advisorDepartment, setAdvisorDepartment] =
// useState("Computer Science");
// const [students, setStudents] = useState([
// {
//     id: 1,
//     name: "John Doe",
//     major: "Computer Science",
//     courses: ["Introduction to Programming"],
//     gpa: 3.5,
// },
// {
//     id: 2,
//     name: "Jane Smith",
//     major: "Computer Science",
//     courses: ["Data Structures"],
//     gpa: 3.7,
// },
// ]);
// const [courses, setCourses] = useState([
// {
//     id: 1,
//     name: "Introduction to Programming",
//     department: "Computer Science",
// },
// { id: 2, name: "Data Structures", department: "Computer Science" },
// { id: 3, name: "Algorithms", department: "Computer Science" },
// ]);
// Route: GET /api/students/:id
// Description: Retrieves a student's information, including their enrollments and GPA.
app.get("/api/students/:id", async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { userId: parseInt(req.params.id) },
            include: {
                user: true,
                enrollments: {
                    include: {
                        course: true,
                    },
                },
            },
        });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Calculate GPA
        let totalPoints = 0;
        let totalCredits = 0;
        student.enrollments.forEach((enrollment) => {
            if (enrollment.grade) {
                totalPoints += enrollment.grade * enrollment.course.credits;
                totalCredits += enrollment.course.credits;
            }
        });

        const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

        res.json({
            ...student,
            gpa: parseFloat(gpa.toFixed(2)),
        });
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: GET /api/students
// Description: Retrieves a list of all students.
app.get("/api/students", async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            include: {
                user: true,
                enrollments: {
                    include: {
                        course: true,
                    },
                },
                advisor: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: POST /api/students
// Description: Creates a new student along with associated user.
app.post("/api/students", async (req, res) => {
    const {
        name,
        username,
        password,
        email,
        major,
        enrollmentYear,
        advisorId,
    } = req.body;
    try {
        const user = await prisma.user.create({
            data: {
                name,
                username,
                password,
                role: "student",
                email,
                Student: {
                    create: {
                        major,
                        enrollmentYear,
                        advisorId,
                    },
                },
            },
            include: {
                Student: true,
            },
        });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

// Route: PUT /api/students/:id
// Description: Updates a student's information.
app.put("/api/students/:id", async (req, res) => {
    const {
        name,
        username,
        password,
        email,
        major,
        enrollmentYear,
        advisorId,
    } = req.body;
    try {
        const student = await prisma.student.update({
            where: { id: parseInt(req.params.id) },
            data: {
                major,
                enrollmentYear,
                advisorId,
                user: {
                    update: {
                        name,
                        username,
                        password,
                        email,
                    },
                },
            },
            include: {
                user: true,
            },
        });
        res.json(student);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

// Route: DELETE /api/students/:id
// Description: Deletes a student and their associated user.
app.delete("/api/students/:id", async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(req.params.id) },
        });
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }
        await prisma.user.delete({
            where: { id: student.userId },
        });
        res.json({ message: "Student deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

// Route: POST /api/students/:id/courses
// Description: Enrolls a student in a course.
app.post("/api/students/:id/courses", async (req, res) => {
    const studentId = parseInt(req.params.id);
    const { courseId } = req.body;
    try {
        const enrollment = await prisma.courseEnrollment.create({
            data: {
                studentId,
                courseId: parseInt(courseId),
            },
        });
        res.json(enrollment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

// Route: DELETE /api/students/:id/courses/:courseId
// Description: Removes a student from a course.
app.delete("/api/students/:id/courses/:courseId", async (req, res) => {
    const studentId = parseInt(req.params.id);
    const courseId = parseInt(req.params.courseId);
    try {
        await prisma.courseEnrollment.delete({
            where: {
                studentId_courseId: {
                    studentId,
                    courseId,
                },
            },
        });
        res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

// Advisor routes

// Route: GET /api/advisors/:id/students
// Description: Retrieves a list of students assigned to a specific advisor.
app.get("/api/advisors/:id/students", async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            where: { advisorId: parseInt(req.params.id) },
            include: {
                user: true,
                enrollments: {
                    include: {
                        course: true,
                    },
                },
            },
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: GET /api/advisors
// Description: Retrieves a list of all advisors.
app.get("/api/advisors", async (req, res) => {
    try {
        const advisors = await prisma.advisor.findMany({
            include: {
                user: true,
                students: true,
            },
        });
        res.json(advisors);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: POST /api/advisors
// Description: Creates a new advisor along with associated user.
app.post("/api/advisors", async (req, res) => {
    const { name, username, password, email, department } = req.body;
    try {
        const user = await prisma.user.create({
            data: {
                name,
                username,
                password,
                role: "advisor",
                email,
                Advisor: {
                    create: {
                        department,
                    },
                },
            },
            include: {
                Advisor: true,
            },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: PUT /api/advisors/:id
// Description: Updates an advisor's information.
app.put("/api/advisors/:id", async (req, res) => {
    const { name, username, password, email, department } = req.body;
    try {
        const advisor = await prisma.advisor.update({
            where: { id: parseInt(req.params.id) },
            data: {
                department,
                user: {
                    update: {
                        name,
                        username,
                        password,
                        email,
                    },
                },
            },
            include: {
                user: true,
            },
        });
        res.json(advisor);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: DELETE /api/advisors/:id
// Description: Deletes an advisor and their associated user.
app.delete("/api/advisors/:id", async (req, res) => {
    try {
        const advisor = await prisma.advisor.findUnique({
            where: { id: parseInt(req.params.id) },
        });
        if (!advisor) {
            return res.status(404).json({ error: "Advisor not found" });
        }
        await prisma.user.delete({
            where: { id: advisor.userId },
        });
        res.json({ message: "Advisor deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Instructor routes

// Route: GET /api/instructors/:id/courses
// Description: Retrieves a list of courses taught by a specific instructor, including enrolled students.
app.get("/api/instructors/:id/courses", async (req, res) => {
    try {
        console.log(req.params.id);
        const courses = await prisma.course.findMany({
            where: { instructorId: parseInt(req.params.id) },
            include: {
                enrollments: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Route: GET /api/instructors
// Description: Retrieves a list of all instructors.
app.get("/api/instructors", async (req, res) => {
    try {
        const instructors = await prisma.instructor.findMany({
            include: {
                user: true,
                courses: true,
            },
        });
        res.json(instructors);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: POST /api/instructors
// Description: Creates a new instructor along with associated user.
app.post("/api/instructors", async (req, res) => {
    const { name, username, password, email, specialization, officeHours } =
        req.body;
    try {
        const user = await prisma.user.create({
            data: {
                name,
                username,
                password,
                role: "instructor",
                email,
                Instructor: {
                    create: {
                        specialization,
                        officeHours,
                    },
                },
            },
            include: {
                Instructor: true,
            },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: PUT /api/instructors/:id
// Description: Updates an instructor's information.
app.put("/api/instructors/:id", async (req, res) => {
    const { name, username, password, email, specialization, officeHours } =
        req.body;
    try {
        const instructor = await prisma.instructor.update({
            where: { id: parseInt(req.params.id) },
            data: {
                specialization,
                officeHours,
                user: {
                    update: {
                        name,
                        username,
                        password,
                        email,
                    },
                },
            },
            include: {
                user: true,
            },
        });
        res.json(instructor);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: DELETE /api/instructors/:id
// Description: Deletes an instructor and their associated user.
app.delete("/api/instructors/:id", async (req, res) => {
    try {
        const instructor = await prisma.instructor.findUnique({
            where: { id: parseInt(req.params.id) },
        });
        if (!instructor) {
            return res.status(404).json({ error: "Instructor not found" });
        }
        await prisma.user.delete({
            where: { id: instructor.userId },
        });
        res.json({ message: "Instructor deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: GET /api/instructors/:id
// Description: Retrieves a specific instructor by ID
app.get("/api/instructors/:id", async (req, res) => {
    try {
        const instructor = await prisma.instructor.findUnique({
            where: { userId: parseInt(req.params.id) },
            include: {
                user: true,
                courses: {
                    include: {
                        enrollments: {
                            include: {
                                student: {
                                    include: {
                                        user: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!instructor) {
            return res.status(404).json({ error: "Instructor not found" });
        }

        res.json(instructor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Route: GET /api/instructors/:id/students
// Description: Retrieves all students enrolled in courses taught by the specified instructor
app.get("/api/instructors/:id/students", async (req, res) => {
    try {
        const instructor = await prisma.instructor.findUnique({
            where: { userId: parseInt(req.params.id) },
            include: {
                courses: {
                    include: {
                        enrollments: {
                            include: {
                                student: {
                                    include: {
                                        user: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!instructor) {
            return res.status(404).json({ error: "Instructor not found" });
        }

        // Extract and flatten all students from all courses
        const students = instructor.courses
            .flatMap((course) => course.enrollments)
            .map((enrollment) => ({
                ...enrollment.student,
                user: enrollment.student.user,
                courseName: enrollment.course?.name,
            }));

        // Remove duplicates if a student is enrolled in multiple courses
        const uniqueStudents = Array.from(
            new Map(
                students.map((student) => [student.userId, student])
            ).values()
        );

        res.json(uniqueStudents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Staff routes

// Route: GET /api/courses
// Description: Retrieves a list of all courses, including instructor information.
app.get("/api/courses", async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                instructor: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: POST /api/courses
// Description: Creates a new course with the provided details.
app.post("/api/courses", async (req, res) => {
    const { name, credits, department, instructorId } = req.body;
    try {
        const course = await prisma.course.create({
            data: {
                name,
                credits,
                department,
                instructorId: parseInt(instructorId),
            },
        });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: PUT /api/courses/:id
// Description: Updates a course's information.
app.put("/api/courses/:id", async (req, res) => {
    const { name, credits, department, instructorId } = req.body;
    try {
        const course = await prisma.course.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                credits,
                department,
                instructorId: parseInt(instructorId),
            },
            include: {
                instructor: true,
            },
        });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: DELETE /api/courses/:id
// Description: Deletes a course.
app.delete("/api/courses/:id", async (req, res) => {
    try {
        await prisma.course.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.json({ message: "Course deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: GET /api/courses
// Description: Retrieves a list of all courses, including instructor information.
app.get("/api/courses", async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                instructor: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// User routes

// Route: GET /api/users
// Description: Retrieves a list of all users with basic information.
app.get("/api/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: POST /api/users
// Description: Creates a new user.
app.post("/api/users", async (req, res) => {
    const { name, username, password, role, email } = req.body;
    try {
        const user = await prisma.user.create({
            data: {
                name,
                username,
                password,
                role,
                email,
            },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: PUT /api/users/:id
// Description: Updates a user's information.
app.put("/api/users/:id", async (req, res) => {
    const { name, username, password, role, email } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                username,
                password,
                role,
                email,
            },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

// Route: DELETE /api/users/:id
// Description: Deletes a user.
app.delete("/api/users/:id", async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

const PORT = process.env.PORT || 3033;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
