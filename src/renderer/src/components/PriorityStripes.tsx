import React from 'react'

const PriorityStripes = (): React.JSX.Element => (
  <div className="flex w-full h-2 overflow-hidden">
    {[...Array(30)].map((_, i) => (
      <div key={i} className="flex flex-1">
        <div className="flex-1 bg-[#003366] -skew-x-12 mx-[0.5px]" />
        <div className="flex-1 bg-[#E71921] -skew-x-12 mx-[0.5px]" />
      </div>
    ))}
  </div>
)

export default PriorityStripes
