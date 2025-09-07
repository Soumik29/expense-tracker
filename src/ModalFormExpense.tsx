import {
  Button,
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  Input,
  Label,
  Select,
  Textarea,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import type { Expense } from "./types";
import { useState } from "react";
import type { ExpenseCategory } from "./AddExpenseForm";

interface modalClose {
  close: (boo: boolean) => void; //this is actually setIsOpen setter which is being passed from the parent.
  open: boolean; //this is the state variable of isOpen which is also being passed from the parent.
  exp: Expense;
  onUpdateExpense: (expe: Expense) => void;
}

const ModalFormExpense = ({
  close,
  open,
  exp,
  onUpdateExpense,
}: modalClose) => {
  const [tempExpValues, setTempExpValues] = useState<Expense>(exp);
  return (
    <Dialog
      open={open}
      as="div"
      onClose={() => {
        close(false);
        setTempExpValues(exp);
      }}
      className="relative z-10 focus:outline-none"
    >
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-gray-900 p-8 shadow-2xl border border-gray-700 backdrop-blur-lg duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0">
            <DialogTitle className="text-xl font-semibold text-white mb-2">
              ✏️ Edit Expense
            </DialogTitle>
            <Description className="text-gray-400 mb-6">
              Update your expense details below.
            </Description>

            <Field className="space-y-4">
              {/* Amount */}
              <div>
                <Label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount
                </Label>
                <Input
                  type="number"
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={tempExpValues.amount}
                  onChange={(e) =>
                    setTempExpValues((prev) => ({
                      ...prev,
                      amount: parseInt(e.target.value),
                    }))
                  }
                />
              </div>

              {/* Category */}
              <div>
                <Label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </Label>
                <div className="relative">
                  <Select
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={tempExpValues.category}
                    onChange={(e) =>
                      setTempExpValues((prev) => ({
                        ...prev,
                        category: e.target.value as ExpenseCategory,
                      }))
                    }
                  >
                    <option value="Food">Food</option>
                    <option value="groceries">Groceries</option>
                    <option value="mobileBill">Mobile Bill</option>
                    <option value="shopping">Shopping</option>
                    <option value="games">Games</option>
                    <option value="subscription">Subscription</option>
                    <option value="emi">EMI</option>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </Label>
                <Textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={tempExpValues.description}
                  onChange={(e) =>
                    setTempExpValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Date */}
              <div>
                <Label className="block text-sm font-medium text-gray-300 mb-1">
                  Date
                </Label>
                <Input
                  type="date"
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={`${new Date(tempExpValues.date)
                    .toISOString()
                    .slice(0, 10)}`}
                  onChange={(e) =>
                    setTempExpValues((prev) => ({
                      ...prev,
                      date: new Date(`${e.target.value}T00:00:00`),
                    }))
                  }
                />
              </div>
            </Field>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-600 focus:ring-2 focus:ring-gray-500"
                onClick={() => {
                  close(false);
                  setTempExpValues(exp);
                }}
              >
                Cancel
              </Button>
              <Button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-400"
                onClick={() => {
                  onUpdateExpense(tempExpValues);
                  close(false);
                }}
              >
                Save
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
    // <div>
    //   <p>This is a modal form which will show up when a user clicks on the pen icon beside any expense, so that it let's them edit the expense and save it.</p>
    //   <p>This modal will contain the amount field, the cateogy field, the description field, and the date field to change the date</p>
    //   <p>And at the bottom it will have the modal's cancel and save button.</p>
    // </div>
  );
};

export default ModalFormExpense;
