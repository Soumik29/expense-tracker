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
import type { Expense } from "../types";
import { useState } from "react";
import type { ExpenseCategory, PaymentMethod } from "./AddExpenseForm";

interface modalClose {
  close: (boo: boolean) => void;
  open: boolean;
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

  // When closing the modal, reset the temporary state to the original expense
  const handleClose = () => {
    close(false);
    setTempExpValues(exp);
  };

  return (
    <Dialog
      open={open}
      as="div"
      onClose={handleClose}
      className="relative z-50"
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-gray-700 p-8 shadow-2xl transition-all duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
            ✏️ Edit Expense
          </DialogTitle>
          <Description className="text-gray-400 mt-1 mb-6">
            Update your expense details below.
          </Description>

          <Field as="form" className="space-y-5">
            {/* Amount */}
            <div>
              <Label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </Label>
              <Input
                type="number"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={tempExpValues.amount}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            {/* Category */}
            <div>
              <Label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </Label>
              <Select
                className="w-full appearance-none rounded-lg border border-gray-600 bg-gray-800 text-white p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={tempExpValues.category}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    category: e.target.value as ExpenseCategory,
                  }))
                }
              >
                {/* Corrected values to match the ExpenseCategory type */}
                <option value="Food">Food</option>
                <option value="Groceries">Groceries</option>
                <option value="Mobile_Bill">Mobile Bill</option>
                <option value="Shopping">Shopping</option>
                <option value="Games">Games</option>
                <option value="Subscription">Subscription</option>
                <option value="Travel">Travel</option>
                <option value="EMI">EMI</option>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method
              </Label>
              <Select
                className="w-full appearance-none rounded-lg border border-gray-600 bg-gray-800 text-white p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={tempExpValues.paymentMethod}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value as PaymentMethod,
                  }))
                }
              >
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="UPI">UPI</option>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </Label>
              <Textarea
                rows={3}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              <Label className="block text-sm font-medium text-gray-300 mb-2">
                Date
              </Label>
              <Input
                type="date"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={`${new Date(tempExpValues.date)
                  .toISOString()
                  .slice(0, 10)}`}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    date: new Date(`${e.target.value}T00:00:00`).toString(),
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Input
                type="checkbox"
                id="isRecurringEdit"
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                checked={tempExpValues.isRecurring}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    isRecurring: e.target.checked,
                  }))
                }
              />
              <Label
                htmlFor="isRecurringEdit"
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Recurring Expense?
              </Label>
            </div>
          </Field>

          {/* Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <Button
              className="rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              onClick={() => {
                onUpdateExpense(tempExpValues);
                close(false);
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default ModalFormExpense;
