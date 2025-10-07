'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a sales report.
 *
 * - generateSalesReport - A function that generates a sales report summarizing daily sales, top selling items, and employee hours.
 * - GenerateSalesReportInput - The input type for the generateSalesReport function.
 * - GenerateSalesReportOutput - The return type for the generateSalesReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSalesReportInputSchema = z.object({
  dailySales: z.string().describe('The total sales for the day.'),
  topSellingItems: z.string().describe('A list of the top selling items for the day.'),
  employeeHours: z.string().describe('A summary of employee hours worked for the day.'),
});
export type GenerateSalesReportInput = z.infer<typeof GenerateSalesReportInputSchema>;

const GenerateSalesReportOutputSchema = z.object({
  summary: z.string().describe('A summary of the daily sales, top selling items, and employee hours.'),
});
export type GenerateSalesReportOutput = z.infer<typeof GenerateSalesReportOutputSchema>;

export async function generateSalesReport(input: GenerateSalesReportInput): Promise<GenerateSalesReportOutput> {
  return generateSalesReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesReportPrompt',
  input: {schema: GenerateSalesReportInputSchema},
  output: {schema: GenerateSalesReportOutputSchema},
  prompt: `You are a restaurant manager. You are tasked with generating a sales report summarizing the daily sales, top selling items, and employee hours.

  Daily Sales: {{{dailySales}}}
  Top Selling Items: {{{topSellingItems}}}
  Employee Hours: {{{employeeHours}}}

  Please generate a concise and informative summary of the above information, highlighting key trends and insights.
  `,
});

const generateSalesReportFlow = ai.defineFlow(
  {
    name: 'generateSalesReportFlow',
    inputSchema: GenerateSalesReportInputSchema,
    outputSchema: GenerateSalesReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
