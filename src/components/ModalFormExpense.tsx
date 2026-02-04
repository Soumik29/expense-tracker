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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 p-8 shadow-2xl transition-all duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0">
          <DialogTitle className="text-xl font-semibold text-zinc-900 tracking-tight">
            Edit Expense
          </DialogTitle>
          <Description className="text-zinc-500 text-sm mt-1 mb-8">
            Update your expense details below.
          </Description>

          <Field as="form" className="space-y-5">
            {/* Amount */}
            <div>
              <Label className="block text-sm font-medium text-zinc-700 mb-2">
                Amount
              </Label>
              <Input
                type="number"
                className="w-full rounded-xl border border-zinc-200 bg-white text-zinc-900 px-4 py-3 focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:outline-none transition-all"
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
              <Label className="block text-sm font-medium text-zinc-700 mb-2">
                Category
              </Label>
              <Select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white text-zinc-900 px-4 py-3 focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:outline-none transition-all"
                value={tempExpValues.category}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    category: e.target.value as ExpenseCategory,
                  }))
                }
              >
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
              <Label className="block text-sm font-medium text-zinc-700 mb-2">
                Payment Method
              </Label>
              <Select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white text-zinc-900 px-4 py-3 focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:outline-none transition-all"
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
              <Label className="block text-sm font-medium text-zinc-700 mb-2">
                Description
              </Label>
              <Textarea
                rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-white text-zinc-900 px-4 py-3 focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:outline-none transition-all resize-none"
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
              <Label className="block text-sm font-medium text-zinc-700 mb-2">
                Date
              </Label>
              <Input
                type="date"
                className="w-full rounded-xl border border-zinc-200 bg-white text-zinc-900 px-4 py-3 focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:outline-none transition-all"
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
            <div className="flex items-center gap-3">
              <Input
                type="checkbox"
                id="isRecurringEdit"
                className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
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
                className="text-sm font-medium text-zinc-700 cursor-pointer"
              >
                Recurring Expense
              </Label>
            </div>
          </Field>

          {/* Buttons */}
          <div className="mt-8 flex gap-4">
            <Button
              className="flex-1 rounded-xl bg-white border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 transition-all"
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
