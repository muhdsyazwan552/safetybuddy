import { useState } from "react";
import ExecutorModal from "./ExecutorModal";

const ExecutorBadges = ({ executors }) => {
  const [open, setOpen] = useState(false);

  const displayedExecutors = executors.slice(0, 3);
  const extraCount = executors.length - displayedExecutors.length;

  return (
    <>
      {/* Small badges inside table cell */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {displayedExecutors.map((executor) => (
          <div
            key={executor.id}
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-medium -mr-1.5 border-2 border-white shadow-sm"
            title={executor.name}
          >
            {executor.avatar || executor.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {extraCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center text-xs font-medium">
            +{extraCount}
          </div>
        )}
      </div>

      {/* Modal */}
      <ExecutorModal open={open} onClose={() => setOpen(false)} executors={executors} />
    </>
  );
};

export default ExecutorBadges;
