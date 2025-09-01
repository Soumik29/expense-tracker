import { type Expense } from "./types";
import { type ExpenseCategory } from "./AddExpenseForm";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

type editExpenseProps = {
  expense: Expense | null;
  onClose: () => void;
  onSave: (updatedExpense: Expense) => void;
};

const ModalFormExpense = ({ expense, onClose, onSave }: editExpenseProps) => {
  if (!expense) return null;

  return (
    <div>
      <Dialog open={!!expense} onClose={onClose} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <DialogTitle
                  as="h3"
                  className="text-base font-semibold text-white"
                >
                  Update Expense
                </DialogTitle>
              </div>
              <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="amount"
                    className="block text-sm/6 font-medium text-white"
                  >
                    Amount
                  </label>
                  <div className="mt-2">
                    <input
                      id="amount"
                      name="ExpenseAmount"
                      type="number"
                      placeholder="Amount to be changed"
                      className="block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6"
                      value={expense.amount}
                      onChange={(e) =>
                        onSave({
                          ...expense,
                          amount: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label
                    htmlFor="description"
                    className="block text-sm/6 font-medium text-white"
                  >
                    Description
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="description"
                      name="ExpenseDescription"
                      rows={5}
                      cols={25}
                      placeholder="Expense Description"
                      className="block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6"
                      value={expense.description}
                      onChange={(e) =>
                        onSave({ ...expense, description: e.target.value })
                      }
                    >
                      Spent on Food
                    </textarea>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label
                    htmlFor="date"
                    className="block text-sm/6 font-medium text-white"
                  >
                    Date
                  </label>
                  <div className="mt-2">
                    <input
                      id="date"
                      name="ExpenseDate"
                      type="date"
                      className="block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6"
                      onChange={(e) =>
                        onSave({ ...expense, date: new Date(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label
                    htmlFor="category"
                    className="block text-sm/6 font-medium text-white"
                  >
                    Category
                  </label>
                  <div className="mt-2">
                    <select
                      id="category"
                      name="Expense Category"
                      value={expense.category}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        onSave({...expense, category: e.target.value as ExpenseCategory})
                      }
                    >
                      <option value="Groceries">Groceries</option>
                      <option value="Food">Food</option>
                      <option value="Mobile Bill">Mobile Bill</option>
                      <option value="Travel">Travel</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Games">Games</option>
                      <option value="Subscription">Subscription</option>
                      <option value="EMI">EMI</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400 sm:ml-3 sm:w-auto"
                >
                  Save
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => onClose()}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ModalFormExpense;
