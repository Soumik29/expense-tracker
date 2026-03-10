import api from "./api";
import type { Income, newIncome } from "../types";

interface IncomeResponse {
  income: Income;
}

export const incomeService = {
  async getAll(): Promise<Income[]> {
    const response = await api.get<Income[]>("/incomes");
    const incomes = Array.isArray(response.data) ? response.data : [];

    return incomes.map((inc) => ({
      ...inc,
      date: new Date(inc.date).toISOString(),
    }));
  },

  async create(income: newIncome): Promise<Income> {
    const response = await api.post<IncomeResponse>("/incomes", income);
    const created = response.data?.income || response.data;

    if (!created) {
      throw new Error("Server response missing income data");
    }

    return {
      ...created,
      date: new Date((created as Income).date).toISOString(),
    } as Income;
  },

  async update(income: Income): Promise<Income> {
    const response = await api.put<IncomeResponse>(
      `/incomes/${income.id}`,
      income,
    );
    const updated = response.data?.income || response.data;

    return {
      ...updated,
      date: new Date((updated as Income).date).toISOString(),
    } as Income;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/incomes/${id}`);
  },
};

export default incomeService;

