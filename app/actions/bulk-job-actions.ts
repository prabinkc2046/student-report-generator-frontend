'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getActiveBulkJob() {
    try {
        const latestJob = await prisma.bulkJob.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        return {
            success: true,
            job: latestJob,
            isActive: latestJob && latestJob.status !== 'completed'
        };
    } catch (error) {
        console.error('Error fetching bulk job:', error);
        return {
            success: false,
            job: null,
            isActive: false
        };
    }
}

export async function revalidateBulkPage() {
    revalidatePath('/bulk-report');
}