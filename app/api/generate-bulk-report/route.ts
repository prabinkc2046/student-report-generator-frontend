import { queryOllam } from "@/prisma/seed";
import { NextResponse } from "next/server";
import { after } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
    const { students } = await request.json()

    // Create bulk job record
    const bulkJob = await prisma.bulkJob.create({
        data: {
            totalStudents: students.length,
            students: students,
            status: "processing",
            completedCount: 0,
            failedCount: 0
        }
    })

    after(async () => {
        let completed = 0;
        let failed = 0;
        const results = [];

        for (const studentData of students) {
            try {
                // Check if student exists
                let student = await prisma.student.findFirst({
                    where: {
                        name: studentData.student_name,
                        pronoun: studentData.pronoun
                    }
                })

                // Create student if not exists
                if (!student) {
                    student = await prisma.student.create({
                        data: {
                            name: studentData.student_name,
                            pronoun: studentData.pronoun,
                            characteristics: studentData.attributes.join(", ")
                        }
                    })
                }

                // Generate report
                const report = await queryOllam(studentData)

                // Save to Report model
                await prisma.report.create({
                    data: {
                        attributes: studentData.attributes.join(", "),
                        charCount: report.length,
                        report: report,
                        studentId: student.id
                    }
                })

                // Save to ReportHistory
                await prisma.reportHistory.create({
                    data: {
                        report: report,
                        studentId: student.id
                    }
                })

                completed++;
                results.push({ student: studentData.student_name, success: true })
                console.log(`Inserted report for ${studentData.student_name}`)

            } catch (error) {
                failed++;
                results.push({ student: studentData.student_name, success: false, error: String(error) })
                console.error(`Failed for ${studentData.student_name}:`, error)
            }

            // Update job progress after each student
            await prisma.bulkJob.update({
                where: { id: bulkJob.id },
                data: {
                    completedCount: completed,
                    failedCount: failed,
                    results: results,
                    status: completed + failed === students.length ? "completed" : "processing"
                }
            })

            // Revalidate after each report
            revalidatePath('/bulk-report')
            revalidatePath('/')
        }

        // Final update
        await prisma.bulkJob.update({
            where: { id: bulkJob.id },
            data: {
                status: "completed",
                completedCount: completed,
                failedCount: failed,
                results: results
            }
        })

        console.log(`Bulk job ${bulkJob.id} completed: ${completed} success, ${failed} failed`)
    })

    return NextResponse.json({
        message: "Background job started",
        totalStudents: students.length,
        jobId: bulkJob.id
    })
}

// GET endpoint to fetch active job
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (jobId) {
        const job = await prisma.bulkJob.findUnique({
            where: { id: jobId }
        })
        return NextResponse.json({ success: true, job })
    }

    // Get latest active or recent job
    const latestJob = await prisma.bulkJob.findFirst({
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, job: latestJob })
}