import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  university: z.string().min(2, { message: 'University is required.' }),
  college: z.string().min(2, { message: 'College is required.' }),
  role: z.enum(['student', 'professor'], { required_error: 'Please select a role.' }),
  major: z.string().optional(),
  graduationYear: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({invalid_type_error: 'Please enter a valid year.'}).optional()
  ),
  department: z.string().optional(),
  researchInterests: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'student') {
        if (!data.major || data.major.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Major is required.',
                path: ['major'],
            });
        }
        if (data.graduationYear === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Graduation year is required.',
                path: ['graduationYear'],
            });
        }
    }
    if (data.role === 'professor') {
        if (!data.department || data.department.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Department is required.',
                path: ['department'],
            });
        }
    }
});
