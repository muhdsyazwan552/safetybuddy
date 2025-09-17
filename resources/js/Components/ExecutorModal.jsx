import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const ExecutorModal = ({ open, onClose, executors }) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={onClose} // ⬅ ESC + click outside will close
      >
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>

        {/* Center modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all">
              {/* Header */}
              <div className="flex justify-between items-center border-b px-5 py-3">
                <Dialog.Title className="text-lg font-semibold">
                  Executors
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {executors.map((executor) => (
                  <div
                    key={executor.id}
                    className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <p className="font-medium">{executor.name}</p>
                    <p className="text-sm text-gray-600">
                      Role: {executor.pivot?.role_assignment || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Staff Count: {executor.staff?.length || 0}
                    </p>

                    {executor.staff?.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                        {executor.staff.map((s) => (
                          <li key={s.id}>
                            {s.name} – {s.email}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ExecutorModal;
