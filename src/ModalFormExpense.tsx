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
  close: (boo: boolean) => void;
  open: boolean;
  exp: Expense;
  saveExpense: (expe: Expense[]) => void;
}

const ModalFormExpense = ({ close, open, exp, saveExpense }: modalClose) => {
  const [tempExpValues, setTempExpValues] = useState<Expense>(exp);

  // const handleSaveExpense = (id: number) => {

  // }
  return (
    <Dialog
      open={open}
      as="div"
      onClose={() => close(true)}
      className="relative z-10 focus:outline-none"
    >
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white/5 p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0">
            <DialogTitle className="text-base/7 font-medium text-white">Edit Expense</DialogTitle>
            <Description>Please make your changes below</Description>
            <Field>
              <Label className="text-sm/6 font-medium text-white">Amount</Label>
              <Input
                type="number"
                name="Expense Amount"
                className="border data-focus:bg-blue-100 data-hover:shadow"
                value={tempExpValues.amount}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    amount: parseInt(e.target.value),
                  }))
                }
              />
              <Label className="text-sm/6 font-medium text-white">
                Category
              </Label>
              <Select
                className="border data-focus:bg-blue-100 data-hover:shadow"
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
              <ChevronDownIcon
                className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
                aria-hidden="true"
              />
              <Label className="text-sm/6 font-medium text-white">
                Description
              </Label>
              <Textarea
                className="border data-focus:bg-blue-100 data-hover:shadow"
                rows={5}
                cols={33}
                value={tempExpValues.description}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              ></Textarea>
              <Label className="text-sm/6 font-medium text-white">Date</Label>
              <Input
                type="date"
                name="Expense Date"
                className="border data-focus:bg-blue-100 data-hover:shadow"
                value={tempExpValues.date.toDateString()}
                onChange={(e) =>
                  setTempExpValues((prev) => ({
                    ...prev,
                    date: new Date(e.target.value),
                  }))
                }
              />
            </Field>
            {/* <div className="mt-4">
                <Button
                  className="inline-flex items-center gap-2 rounded-md bg-gray-700 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white data-hover:bg-gray-600 data-open:bg-gray-700"
                  onClick={saveExpense()}
                >
                  Save
                </Button>
              </div> */}
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
