// app/actions/attribute-actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type Attribute = {
  id: string;
  category: string;
  name: string;
  isEnabled: boolean;
};

// Initialize default attributes
export async function initializeDefaultAttributes() {
  const defaultAttributes = {
    'Reading Skills': [
      'reads fluently at grade level',
      'reads above grade level with comprehension',
      'struggles with decoding words',
      'needs support with phonics',
      'has difficulty with reading comprehension',
      'reads with good expression and pacing',
      'reads slowly and hesitantly',
      'enjoys reading independently',
      'needs encouragement to read at home'
    ],
    'Writing Skills': [
      'writes creative and imaginative stories',
      'struggles with organizing ideas in writing',
      'has neat and legible handwriting',
      'needs improvement in handwriting legibility',
      'uses rich vocabulary in writing',
      'struggles with spelling and punctuation',
      'writes complete sentences with proper grammar',
      'needs support with sentence structure'
    ],
    'Mathematics Skills': [
      'excels in mental math calculations',
      'struggles with basic addition and subtraction',
      'understands multiplication and division concepts',
      'needs support with multiplication tables',
      'has difficulty with word problems',
      'good at problem-solving and logical reasoning',
      'struggles with fractions and decimals',
      'understands geometry and measurement concepts',
      'applies math skills to real-life situations'
    ],
    'Science & Social Studies': [
      'curious and asks thoughtful questions',
      'enjoys hands-on experiments and investigations',
      'demonstrates good understanding of scientific concepts',
      'struggles with understanding cause and effect',
      'shows interest in how things work',
      'understands basic historical timelines and events',
      'demonstrates awareness of different cultures'
    ],
    'Attention & Focus': [
      'sustains attention during whole group instruction',
      'easily distracted by surroundings or peers',
      'fidgets frequently during seat work',
      'needs reminders to stay on task',
      'able to refocus after redirection',
      'difficulty transitioning between activities',
      'demonstrates good concentration during tests',
      'often daydreams or seems lost in thought'
    ],
    'Social Skills': [
      'works cooperatively in group settings',
      'shares materials and takes turns',
      'respects peers and listens to their ideas',
      'sometimes struggles to share or wait for turn',
      'shy and hesitant to participate in groups',
      'confident speaking in front of class',
      'shows empathy towards classmates',
      'resolves conflicts appropriately',
      'needs support with social boundaries'
    ],
    'Behavior & Conduct': [
      'follows classroom rules consistently',
      'respectful towards teachers and staff',
      'kind and helpful to classmates',
      'sometimes disrupts class with off-task behavior',
      'responds well to positive reinforcement',
      'needs clear expectations and structure',
      'accepts responsibility for actions',
      'demonstrates good self-control and impulse management'
    ],
    'Emotional Regulation': [
      'manages emotions appropriately',
      'becomes anxious during tests or assessments',
      'easily frustrated when facing challenges',
      'stresses when there is too much priority',
      'seeks help when feeling overwhelmed',
      'persists through difficult tasks',
      'needs encouragement to build confidence',
      'shows resilience after setbacks',
      'expresses feelings appropriately'
    ],
    'Work Habits': [
      'completes homework on time consistently',
      'organized and keeps materials tidy',
      'often forgets to bring supplies to class',
      'takes pride in work and produces quality output',
      'needs improvement in focus during independent work',
      'works well independently with minimal supervision',
      'routinely checks work for errors',
      'uses class time efficiently'
    ],
    'Participation & Engagement': [
      'actively participates in class discussions',
      'raises hand before speaking',
      'reluctant to volunteer answers',
      'contributes meaningful ideas during group work',
      'listens attentively when others speak',
      'needs encouragement to share thoughts',
      'enthusiastic and eager to learn'
    ],
    'Motivation & Attitude': [
      'highly motivated and self-directed learner',
      'shows initiative in learning new topics',
      'needs external motivation to complete tasks',
      'displays positive attitude towards school',
      'sometimes lacks effort in assignments',
      'sets goals and works towards achieving them',
      'celebrates others\' successes'
    ],
    'Communication Skills': [
      'expresses ideas clearly and logically',
      'uses appropriate language for different situations',
      'asks relevant and thoughtful questions',
      'difficulty articulating thoughts verbally',
      'listens and follows multi-step directions',
      'needs reminders to follow instructions'
    ]
  };

  try {
    for (const [category, attributes] of Object.entries(defaultAttributes)) {
      for (const attributeName of attributes) {
        await prisma.attribute.upsert({
          where: {
            category_name: {
              category,
              name: attributeName,
            },
          },
          update: {},
          create: {
            category,
            name: attributeName,
            isEnabled: true,
          },
        });
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error initializing attributes:', error);
    return { success: false, error: 'Failed to initialize attributes' };
  }
}

// Get all attributes grouped by category
export async function getAllAttributes() {
  try {
    const attributes = await prisma.attribute.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
    });

    // Group by category
    const grouped = attributes.reduce((acc, attr) => {
      if (!acc[attr.category]) {
        acc[attr.category] = [];
      }
      acc[attr.category].push(attr);
      return acc;
    }, {} as Record<string, Attribute[]>);

    return {
      success: true,
      attributes: grouped,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return {
      success: false,
      attributes: {},
      error: 'Failed to fetch attributes',
    };
  }
}

// Get only enabled attributes
export async function getEnabledAttributes() {
  try {
    const attributes = await prisma.attribute.findMany({
      where: { isEnabled: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
    });

    // Group by category
    const grouped = attributes.reduce((acc, attr) => {
      if (!acc[attr.category]) {
        acc[attr.category] = [];
      }
      acc[attr.category].push(attr.name);
      return acc;
    }, {} as Record<string, string[]>);

    return {
      success: true,
      attributes: grouped,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching enabled attributes:', error);
    return {
      success: false,
      attributes: {},
      error: 'Failed to fetch enabled attributes',
    };
  }
}

// Update attribute enabled status
export async function updateAttributeStatus(attributeId: string, isEnabled: boolean) {
  try {
    await prisma.attribute.update({
      where: { id: attributeId },
      data: { isEnabled },
    });
    
    revalidatePath('/settings');
    revalidatePath('/');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating attribute:', error);
    return { success: false, error: 'Failed to update attribute' };
  }
}

// Bulk update attributes
export async function bulkUpdateAttributes(updates: { id: string; isEnabled: boolean }[]) {
  try {
    await prisma.$transaction(
      updates.map(update =>
        prisma.attribute.update({
          where: { id: update.id },
          data: { isEnabled: update.isEnabled },
        })
      )
    );
    
    revalidatePath('/settings');
    revalidatePath('/');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error bulk updating attributes:', error);
    return { success: false, error: 'Failed to update attributes' };
  }
}