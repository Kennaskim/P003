import { api } from '../axios';

export interface FinancialSummary {
    month: string;
    grossIncome: number;
    managementFee: number;
    expenses: number;
    netPayout: number;
    activeProperties: number;
    occupancyRate: number;
}

export const getFinancialSummary = async (month: string): Promise<{ success: boolean; data: FinancialSummary }> => {
    const response = await api.get(`/reports/summary?month=${month}`);
    return response.data;
};

export const downloadStatementPdf = async (month: string): Promise<Blob> => {
    // We must set responseType to 'blob' to handle binary file data correctly
    const response = await api.get(`/reports/statement/download?month=${month}`, {
        responseType: 'blob',
    });
    return response.data;
};
