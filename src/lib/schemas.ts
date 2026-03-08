
import { z } from 'zod';

const baseSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  university: z.string().min(2, { message: 'University is required.' }),
  college: z.string().min(2, { message: 'College is required.' }),
});

const studentSchema = baseSchema.extend({
  role: z.literal('student'),
  major: z.string({ required_error: 'Major is required.' }).min(1, { message: 'Major is required.' }),
  graduationYear: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({ required_error: 'Graduation year is required.', invalid_type_error: 'Please enter a valid year.' })
  ),
  department: z.string().optional(),
  researchInterests: z.string().optional(),
});

const professorSchema = baseSchema.extend({
  role: z.literal('professor'),
  department: z.string({ required_error: 'Department is required.' }).min(1, { message: 'Department is required.' }),
  researchInterests: z.string().optional(),
  major: z.string().optional(),
  graduationYear: z.any().optional(),
});

export const signupSchema = z.discriminatedUnion('role', [
  studentSchema,
  professorSchema,
]);
