// app/actions/student-actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schema for student data
const StudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  pronoun: z.string().min(1, "Pronoun is required"),
  characteristics: z.string().min(1, "Characteristics are required"),
});

const StudentsArraySchema = z.array(StudentSchema);

export type StudentInput = z.infer<typeof StudentSchema>;

/**
 * Server action to save multiple students to the database
 * @param students - Array of student objects with name, pronoun, and characteristics
 * @returns Object containing success status, saved students, and error message if any
 */
export async function saveStudentsToDatabase(students: StudentInput[]) {
  try {
    // Validate input data
    const validatedStudents = StudentsArraySchema.parse(students);

    if (!validatedStudents.length) {
      return {
        success: false,
        error: "No students provided to save",
        savedCount: 0,
      };
    }

    // Use transaction to ensure all students are saved or none
    const savedStudents = await prisma.$transaction(
      validatedStudents.map((student) =>
        prisma.student.create({
          data: {
            name: student.name.trim(),
            pronoun: student.pronoun.trim(),
            characteristics: student.characteristics.trim(),
          },
        })
      )
    );

    // Revalidate the students page to show updated data
    revalidatePath('/students');
    revalidatePath('/students/upload');

    return {
      success: true,
      savedCount: savedStudents.length,
      students: savedStudents,
      error: null,
    };
  } catch (error) {
    console.error("Error saving students to database:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        // error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        savedCount: 0,
      };
    }

    // Handle Prisma errors
    if (error instanceof Error) {
      return {
        success: false,
        error: `Database error: ${error.message}`,
        savedCount: 0,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while saving students",
      savedCount: 0,
    };
  }
}


export async function deleteStudentById(studentId: string) {
  try {
    await prisma.student.delete({
      where: { id: studentId },
    });

    revalidatePath('/students');

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error deleting student:", error);
    return {
      success: false,
      error: "Failed to delete student",
    };
  }
}

// Add this new function to fetch student with their characteristics
export async function getStudentWithCharacteristics(studentId: string) {
  try {
    // Fetch just the student without relations since characteristics is a scalar field
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      // Remove the include block since characteristics is not a relation
      // and savedReports doesn't exist in your schema
    });

    if (!student) {
      return {
        success: false,
        error: 'Student not found',
        student: null,
      };
    }

    // Parse characteristics if stored as JSON or comma-separated string
    let characteristics: string[] = [];

    if (student.characteristics) {
      try {
        // If characteristics are stored as a comma-separated string
        if (typeof student.characteristics === 'string') {
          // Check if it's a JSON string first
          if (student.characteristics.startsWith('[') && student.characteristics.endsWith(']')) {
            // Parse as JSON array
            const parsed = JSON.parse(student.characteristics);
            if (Array.isArray(parsed)) {
              characteristics = parsed;
            }
          } else {
            // Split by comma for comma-separated string
            characteristics = student.characteristics.split(',').map(c => c.trim()).filter(c => c);
          }
        }
        // If stored as an object (shouldn't happen with scalar field, but just in case)
        else if (Array.isArray(student.characteristics)) {
          characteristics = student.characteristics;
        }
      } catch (e) {
        console.error('Error parsing characteristics:', e);
        // If parsing fails, treat as plain string
        if (typeof student.characteristics === 'string') {
          characteristics = [student.characteristics];
        }
      }
    }

    return {
      success: true,
      student: {
        id: student.id,
        name: student.name,
        pronoun: student.pronoun,
        characteristics: characteristics,
        characteristicsString: student.characteristics || '',
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching student with characteristics:', error);
    return {
      success: false,
      error: 'Failed to fetch student data',
      student: null,
    };
  }
}

// Function to save student characteristics
export async function saveStudentCharacteristics(studentId: string, characteristics: string[]) {
  try {
    // Store as comma-separated string
    const characteristicsString = characteristics.join(', ');

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        characteristics: characteristicsString,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      student: updatedStudent,
      error: null,
    };
  } catch (error) {
    console.error('Error saving characteristics:', error);
    return {
      success: false,
      error: 'Failed to save characteristics',
      student: null,
    };
  }
}


// app/actions/student-actions.ts (add this function)



// Optional: Function to get reports for a student
export async function getStudentReports(studentId: string) {
  try {
    const reports = await prisma.report.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      reports,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return {
      success: false,
      error: 'Failed to fetch reports',
      reports: [],
    };
  }
}

// app/actions/student-actions.ts (add this function)

/**
 * Server action to delete a report by ID
 */
export async function deleteReport(reportId: string) {
  try {
    await prisma.report.delete({
      where: { id: reportId },
    });

    revalidatePath('/saved-reports');
    revalidatePath('/');

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error deleting report:", error);
    return {
      success: false,
      error: "Failed to delete report",
    };
  }
}

/**
 * Server action to get all reports with student information
 */



// Update the saveReportToDatabase function
export async function saveReportToDatabase(data: {
  studentId: string;
  report: string;
  attributes: string[];
  charCount: number;
}) {
  try {
    // Create the report
    const savedReport = await prisma.report.create({
      data: {
        studentId: data.studentId,
        report: data.report,
        attributes: data.attributes.join(', '),
        charCount: data.charCount,
      },
      include: {
        student: true,
      },
    });

    // Update the student's hasSavedReport flag to true
    await prisma.student.update({
      where: { id: data.studentId },
      data: { hasSavedReport: true },
    });

    revalidatePath('/');
    revalidatePath('/saved-reports');

    return {
      success: true,
      report: savedReport,
      error: null,
    };
  } catch (error) {
    console.error('Error saving report:', error);
    return {
      success: false,
      error: 'Failed to save report',
      report: null,
    };
  }
}

// Update getAllStudents to optionally exclude students with saved reports
export async function getAllStudents(includeWithReports: boolean = true) {
  try {
    const students = await prisma.student.findMany({
      where: includeWithReports ? undefined : { hasSavedReport: false },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      students,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching students:", error);
    return {
      success: false,
      error: "Failed to fetch students",
      students: [],
    };
  }
}

// Add function to get students without saved reports
export async function getStudentsWithoutReports() {
  try {
    const students = await prisma.student.findMany({
      where: { hasSavedReport: false },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      students,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching students without reports:", error);
    return {
      success: false,
      error: "Failed to fetch students",
      students: [],
    };
  }
}


// app/actions/student-action.ts

// Add these new functions

// Publish a report to the published_reports table
export async function publishReport(reportId: string, publishedBy?: string) {
  try {
    // Get the original report with student data
    const originalReport = await prisma.report.findUnique({
      where: { id: reportId },
      include: { student: true }
    });

    if (!originalReport) {
      return {
        success: false,
        error: 'Report not found',
      };
    }

    // Create published report
    const publishedReport = await prisma.publishedReport.create({
      data: {
        studentId: originalReport.studentId,
        studentName: originalReport.student.name,
        studentPronoun: originalReport.student.pronoun,
        report: originalReport.report,
        attributes: originalReport.attributes,
        charCount: originalReport.charCount,
        publishedBy: publishedBy || 'teacher',
        status: 'published',
      },
    });

    // Update student's hasSavedReport status to false (can generate new report)
    await prisma.student.update({
      where: { id: originalReport.studentId },
      data: { hasSavedReport: false },
    });

    // Optional: Delete the original report after publishing
    // await prisma.report.delete({ where: { id: reportId } });

    revalidatePath('/saved-reports');
    revalidatePath('/');

    return {
      success: true,
      publishedReport,
      error: null,
    };
  } catch (error) {
    console.error('Error publishing report:', error);
    return {
      success: false,
      error: 'Failed to publish report',
    };
  }
}


// Get published reports
export async function getPublishedReports() {
  try {
    const publishedReports = await prisma.publishedReport.findMany({
      orderBy: { publishedAt: 'desc' },
    });

    return {
      success: true,
      reports: publishedReports,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching published reports:", error);
    return {
      success: false,
      error: "Failed to fetch published reports",
      reports: [],
    };
  }
}

// Unpublish/archive a report
export async function unpublishReport(reportId: string) {
  try {
    await prisma.publishedReport.update({
      where: { id: reportId },
      data: { status: 'archived' },
    });

    revalidatePath('/saved-reports');

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error unpublishing report:", error);
    return {
      success: false,
      error: "Failed to unpublish report",
    };
  }
}

// app/actions/student-actions.ts - Add these functions

/**
 * Server action to generate reports for multiple students
 */
export async function generateBulkReports(studentIds: string[], attributes: string[]) {
  try {
    const results = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        // Get student details
        const student = await prisma.student.findUnique({
          where: { id: studentId },
        });

        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Call the generate report API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_name: student.name,
            pronoun: student.pronoun,
            attributes: attributes.join(', ')
          })
        });

        const data = await response.json();

        if (data.success) {
          // Save the report to database
          const savedReport = await prisma.report.create({
            data: {
              studentId: student.id,
              report: data.report,
              attributes: attributes.join(', '),
              charCount: data.char_count,
            },
          });

          // Update student's hasSavedReport flag
          await prisma.student.update({
            where: { id: student.id },
            data: { hasSavedReport: true },
          });

          results.push({
            studentId,
            studentName: student.name,
            success: true,
            report: savedReport,
          });
        } else {
          errors.push({ studentId, studentName: student.name, error: data.error });
        }
      } catch (error) {
        console.error(`Error generating report for student ${studentId}:`, error);
        errors.push({ studentId, error: 'Failed to generate report' });
      }
    }

    revalidatePath('/');
    revalidatePath('/saved-reports');

    return {
      success: true,
      results,
      errors,
      totalProcessed: results.length,
      totalErrors: errors.length,
    };
  } catch (error) {
    console.error('Error in bulk report generation:', error);
    return {
      success: false,
      error: 'Failed to generate bulk reports',
      results: [],
      errors: [],
    };
  }
}

/**
 * Get all students that can generate reports (no saved reports yet)
 */
export async function getAvailableStudentsForBulk() {
  try {
    const students = await prisma.student.findMany({
      where: { hasSavedReport: false },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        pronoun: true,
      },
    });

    return {
      success: true,
      students,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching available students:", error);
    return {
      success: false,
      error: "Failed to fetch students",
      students: [],
    };
  }
}

/**
 * Server action to get all reports with student information
 */
export async function getAllReports() {
  try {
    const reports = await prisma.report.findMany({
      include: {
        student: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      reports,
      count: reports.length,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching all reports:", error);
    return {
      success: false,
      error: "Failed to fetch reports",
      reports: [],
      count: 0,
    };
  }
}