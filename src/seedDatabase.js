const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createUsers() {
    try {
        // Clear existing data
        await prisma.courseEnrollment.deleteMany({});
        await prisma.course.deleteMany({});
        await prisma.student.deleteMany({});
        await prisma.instructor.deleteMany({});
        await prisma.advisor.deleteMany({});
        await prisma.staff.deleteMany({});
        await prisma.user.deleteMany({});

        // Create an advisor
        const advisor = await prisma.user.create({
            data: {
                name: "Dr. Jane Smith",
                username: "jsmith",
                password: "password123",
                role: "advisor",
                email: "jsmith@university.edu",
                Advisor: {
                    create: {
                        department: "Computer Science",
                    },
                },
            },
            include: {
                Advisor: true,
            },
        });

        // Create instructors with their courses
        const instructors = await Promise.all([
            prisma.user.create({
                data: {
                    id: 10,
                    name: "Prof. John Doe",
                    username: "jdoe",
                    password: "password123",
                    role: "instructor",
                    email: "jdoe@university.edu",
                    Instructor: {
                        create: {
                            specialization: "Database Systems",
                            officeHours: "Mon/Wed 2-4pm",
                        },
                    },
                },
                include: {
                    Instructor: true,
                },
            }),
            prisma.user.create({
                data: {
                    id: 11,
                    name: "Dr. Sarah Williams",
                    username: "swilliams",
                    password: "password123",
                    role: "instructor",
                    email: "swilliams@university.edu",
                    Instructor: {
                        create: {
                            specialization: "Software Engineering",
                            officeHours: "Tue/Thu 1-3pm",
                        },
                    },
                },
                include: {
                    Instructor: true,
                },
            }),
        ]);

        // Create staff members
        const staffMembers = await Promise.all([
            prisma.user.create({
                data: {
                    id: 20,
                    name: "Mary Johnson",
                    username: "mjohnson",
                    password: "password123",
                    role: "staff",
                    email: "mjohnson@university.edu",
                    Staff: {
                        create: {
                            department: "Registrar's Office",
                        },
                    },
                },
                include: {
                    Staff: true,
                },
            }),
            prisma.user.create({
                data: {
                    id: 21,
                    name: "Robert Brown",
                    username: "rbrown",
                    password: "password123",
                    role: "staff",
                    email: "rbrown@university.edu",
                    Staff: {
                        create: {
                            department: "Student Affairs",
                        },
                    },
                },
                include: {
                    Staff: true,
                },
            }),
        ]);

        // Create courses
        const courses = await Promise.all([
            prisma.course.create({
                data: {
                    id: 1,
                    name: "Advanced Database Systems",
                    credits: 3,
                    department: "Computer Science",
                    instructorId: instructors[0].Instructor.id,
                },
            }),
            prisma.course.create({
                data: {
                    id: 2,
                    name: "Software Engineering Principles",
                    credits: 3,
                    department: "Computer Science",
                    instructorId: instructors[1].Instructor.id,
                },
            }),
            prisma.course.create({
                data: {
                    id: 3,
                    name: "Data Structures",
                    credits: 4,
                    department: "Computer Science",
                    instructorId: instructors[0].Instructor.id,
                },
            }),
        ]);

        // Create students with enrollments
        const students = await Promise.all([
            prisma.user.create({
                data: {
                    id: 1,
                    name: "Alice Johnson",
                    username: "ajohnson",
                    password: "password123",
                    role: "student",
                    email: "ajohnson@university.edu",
                    Student: {
                        create: {
                            major: "Computer Science",
                            gpa: 3.8,
                            enrollmentYear: 2023,
                            advisorId: advisor.Advisor.id,
                            enrollments: {
                                create: [
                                    {
                                        courseId: courses[0].id,
                                        grade: 3.7,
                                    },
                                    {
                                        courseId: courses[1].id,
                                        grade: 3.9,
                                    },
                                ],
                            },
                        },
                    },
                },
            }),
            prisma.user.create({
                data: {
                    id: 2,
                    name: "Bob Wilson",
                    username: "bwilson",
                    password: "password123",
                    role: "student",
                    email: "bwilson@university.edu",
                    Student: {
                        create: {
                            major: "Computer Science",
                            gpa: 3.5,
                            enrollmentYear: 2023,
                            advisorId: advisor.Advisor.id,
                            enrollments: {
                                create: [
                                    {
                                        courseId: courses[1].id,
                                        grade: 3.6,
                                    },
                                    {
                                        courseId: courses[2].id,
                                        grade: 3.4,
                                    },
                                ],
                            },
                        },
                    },
                },
            }),
        ]);

        console.log("Users and enrollments created successfully!");
    } catch (error) {
        console.error("Error creating users:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createUsers();
