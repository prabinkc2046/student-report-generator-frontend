import prisma from "@/lib/prisma"


// task 1
async function addSingleStudent(name: string, pronoun: string, characteristics: string) {
    try {
        // inserting a single student name prabin pronoun he/him and characterstic : "Creative thinker, struggles with group work".
        await prisma.student.create({
            data: {
                name: name,
                pronoun: pronoun,
                characteristics: characteristics
            }
        })
        console.log("New student created")
        return true
    } catch (error) {
        console.error("failed to add student")
        return false
    }
}

// task 1.2
async function addManyStudents() {
    try {
        // adding multiple students when extracted from file
        // model each student as javascript object
        // model group as array

        const newStudents = [
            { name: "prabin", pronoun: "she/her", characteristics: "Excellent writer, needs help with time management" },
            { name: "student 2", pronoun: "he/him", characteristics: "char 2" },
            { name: "student 3", pronoun: "she/her", characteristics: "char 3 " }
        ]

        const created = await prisma.student.createMany({
            data: newStudents,
            skipDuplicates: true
        })

        return created.count

    } catch (error) {
        return 0
    }
}

// task 1.2
async function updateSingleStudent() {
    // just improved their group work skills. Update their characteristics to "Creative thinker, now works well in groups".
    try {
        const name = "Alex Morgan"
        const newChar = "Creative thinker but struggles not in group work"

        const alex = await prisma.student.findFirst({
            where: {
                name: name
            }
        })

        const updated = await prisma.student.update({
            where: {
                id: alex?.id
            },
            data: {
                characteristics: newChar
            }
        })

        return true

    } catch (error) {
        return false
    }
}

// add report for student
async function addReportForSingleStudent() {
    const alex = await prisma.student.findFirst({
        where: {
            name: "Alex Morgan"
        }
    })

    if (!alex) return false

    // Alex Morgan
    await prisma.report.create({
        data: {
            report: "report for alex morgan thid term",
            studentId: alex.id,
            charCount: 850,
            attributes: "good listener etc report 2 second term"
        }
    })
}

// delete single students 
async function deleteSingleStudent() {
    // find student id
    const alex = await prisma.student.findFirst({
        where: {
            name: "Alex Morgan"
        }
    })

    if (!alex) return false

    // delete by student id
    const deleted = await prisma.student.delete({
        where: {
            id: alex.id
        }
    })
    return true
}

// Category "Social Skills": "Initiates peer conversations", "Shares materials"

// Category "Communication": "Expresses ideas clearly", "Asks relevant questions"

// Category "Work Habits": "Completes homework on time", "Organizes materials"
const data = {
    "Social Skills": [
        "Initiates peer conversations",
        "Shares materials"
    ],

    "Communication": [
        "Expresses ideas clearly",
        "Asks relevant questions"
    ],

    "Work Habits": [
        "Completes homework on time",
        "Organizes materials"
    ]
};

const result = Object.entries(data).flatMap(
    ([cat, skills]) =>
        skills.map(skill => ({
            category: cat,
            name: skill,
            isEnabled: true
        }))
)


async function createCategories(data: {
    category: string;
    name: string;
    isEnabled: boolean;
}[]) {


    const created = await prisma.attribute.createMany({
        data: result
    })

    return created.count
}

type Attribute = {
    category: string;
    name: string;
    isEnabled: boolean;
}

async function createSingleAttribute(data: Attribute) {
    const { category, name, isEnabled } = data
    try {
        // before create or insert row check if that category and name already exists
        const isExists = await prisma.attribute.findUnique({
            where: {
                category_name: {
                    category: category,
                    name: name
                }
            }
        })
        if (isExists) {
            return {
                status: 'failed',
                reason: 'Duplicate'
            }
        }

        await prisma.attribute.create({
            data: {
                category: category,
                name: name,
                isEnabled: isEnabled
            }
        })
        return true
    } catch (error) {
        console.log(error)
    }
}

async function createAttribute(data: Attribute) {
    try {
        // i know attribute table in each row, category and name must be unique
        // so we use this constraint if such already exits do nothing or update nameo
        // if does not exists creates completely new
        const { category, name, isEnabled } = data

        const result = await prisma.attribute.upsert({
            where: {
                category_name: {
                    category: category,
                    name: name
                }
            },
            update: {
                isEnabled: isEnabled
            },
            create: {
                name: name,
                category: category,
                isEnabled: isEnabled
            }
        })

    } catch (error) {
        console.log("Something went wrong")
    }
}

type AttributeUpdated = {
    category: string;
    existing_name: string;
    updated_name?: string;
    isEnabled?: boolean
}
async function updateAttribute(data: AttributeUpdated) {
    const { category, existing_name, updated_name, isEnabled } = data
    await prisma.attribute.update({
        where: {
            category_name: {
                category: category,
                name: existing_name
            }
        },
        data: {
            name: updated_name ? updated_name : existing_name,
            isEnabled: isEnabled ? isEnabled : true
        }
    })
}


async function toggleAttribute() {
    const data =
        [
            {
                id: 'cmpqnld500000l96vnf39krpjrrr',
                isEnabled: false,
            },
            {
                id: 'cmpqnld520001l96vqe07pcfz',
                isEnabled: false,
            }
        ]

    for (const d of data) {
        const { id, isEnabled } = d
        try {
            await prisma.attribute.update({
                where: {
                    id: id,
                },
                data: {
                    isEnabled: isEnabled
                }
            })
        } catch (error) {
            console.log("something went wrong")
        }
    }
}

type ReportData = {
    id: string;
    generatedReport: string;
    attributesUsed: string;
    characterCounts: number;
}
async function createReportEntry(data: ReportData) {

    const { id: studentId, generatedReport, attributesUsed, characterCounts } = data

    await prisma.report.create({
        data: {
            studentId: studentId,
            report: generatedReport,
            charCount: characterCounts,
            attributes: attributesUsed,
        }
    })
}

async function editReportEntry(data: ReportData) {

    const { id: reportId, generatedReport, attributesUsed, characterCounts } = data;
    await prisma.report.update({
        where: {
            id: reportId
        },
        data: {
            attributes: attributesUsed,
            report: generatedReport,
            charCount: characterCounts
        }
    })
}

// user generate report
// out come of api model is saved in report history 

// make actual api call to ai to genearte data
const payload = {
    student_name: "Prabin",
    pronoun: "he/him",
    attributes: ["Creative writer", "Loves art"],
    char_len: 850
}
// this function runs when user clicks on generate
type OllamaPayload = {
    student_name: string;
    pronoun: string;
    attributes: string[];
    // char_len: number;
}

export async function queryOllam(data: OllamaPayload) {
    const server = "http://localhost:5001/generate-report";

    const res = await fetch(server, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    const json = await res.json()

    return json['report']

}


// saved the result return by ollama in report history
type SaveToHistoryType = {
    reportGenerated: string;
    studentId: string;
}

async function saveToReportHistory(data: SaveToHistoryType) {

    const { reportGenerated, studentId } = data
    await prisma.reportHistory.create({
        data: {

            report: reportGenerated,
            studentId: studentId
        }
    })
}

// when generate button is clicked
async function generateReport() {
    try {
        // define variables
        const payload = {
            student_name: "Prabin",
            pronoun: "he/him",
            attributes: ["Creative writer", "Loves art"],
            char_len: 850,
            studentId: "cmprzlt7x0000l56v9fbl22oz"
        }

        const reportGenerated = await queryOllam(payload)

        if (!reportGenerated) return false

        await saveToReportHistory({ reportGenerated, studentId: "cmprzlt7x0000l56v9fbl22oz" })
        return {
            status: true,
            report: reportGenerated
        }
    } catch (error) {
        return false
    }
}

async function read() {
    const readResult = await prisma.student.findFirst()

    console.log(readResult)
}

export const bulkReportPayloads = [
    {
        student_name: "Prabin",
        pronoun: "he/him",
        attributes: ["Creative writer", "Loves art", "Team player"]
    },
    {
        student_name: "Sarah Chen",
        pronoun: "she/her",
        attributes: ["Analytical thinker", "Quick learner", "Leadership skills"]
    },
    {
        student_name: "Marcus Rodriguez",
        pronoun: "they/them",
        attributes: ["Problem solver", "Excellent communicator", "Detail oriented"]
    },

]

async function ordinaryFlow() {
    const start = performance.now()
    const list = []
    for (const item of bulkReportPayloads) {
        const result = await queryOllam(item)
        list.push(result)
    }
    console.log(list)
    const end = performance.now()
    console.log(`Took: ${end - start}ms`)
}


async function callmynextjsroute() {
    await fetch("http://localhost:3000/api/generate-bulk-report", {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => console.log(data))
}

async function main() {
    try {
        // await bulkReport1()
        // await ordinaryFlow()
        // await callmynextjsroute()
        await addSingleStudent("prabin", "he/him", "good listener")
    } catch (error) {
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
