'use server';

/**
 * @fileOverview Implements the automated triage feature for vets.
 *
 * - automatedTriage - A function that handles the automated triage process.
 * - AutomatedTriageInput - The input type for the automatedTriage function.
 * - AutomatedTriageOutput - The return type for the automatedTriage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedTriageInputSchema = z.object({
  medicalHistory: z
    .string()
    .describe('The medical history of the animal, including previous conditions, treatments, and medications.'),
});
export type AutomatedTriageInput = z.infer<typeof AutomatedTriageInputSchema>;

const AutomatedTriageOutputSchema = z.object({
  likelyCondition: z.string().describe('The likely condition of the animal based on the medical history.'),
  triageQuestions: z
    .array(z.string())
    .describe('A list of suggested triage questions to ask the vet.'),
  suggestedTreatments: z
    .array(z.string())
    .describe('A list of suggested treatments based on the likely condition.'),
});
export type AutomatedTriageOutput = z.infer<typeof AutomatedTriageOutputSchema>;

export async function automatedTriage(input: AutomatedTriageInput): Promise<AutomatedTriageOutput> {
  return automatedTriageFlow(input);
}

const triagePrompt = ai.definePrompt({
  name: 'triagePrompt',
  input: {schema: AutomatedTriageInputSchema},
  output: {schema: AutomatedTriageOutputSchema},
  prompt: `You are an AI assistant that helps vets with the triage process.

  Based on the provided medical history, you will determine the likely condition of the animal, suggest triage questions to ask, and suggest possible treatments.

  IMPORTANT: You must detect the language of the input 'medicalHistory'. Your entire response, including all fields in the output, must be in the same language as the input. For example, if the input is in Roman Urdu, your output must also be in Roman Urdu.

  Medical History: {{{medicalHistory}}}

  Consider all possible conditions, and provide a broad list of possible triage questions and treatments.

  Ensure the output is well-formatted and easy to read.
`,
});

const automatedTriageFlow = ai.defineFlow(
  {
    name: 'automatedTriageFlow',
    inputSchema: AutomatedTriageInputSchema,
    outputSchema: AutomatedTriageOutputSchema,
  },
  async input => {
    const {output} = await triagePrompt(input);
    return output!;
  }
);
