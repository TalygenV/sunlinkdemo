# ProgressBar Component

A sophisticated progress bar component that displays progression through six distinct stages: Panels, Inverter, Batteries, Design, Overview, and Completion. This component is designed to align with the premium luxury UI theme established in the application.

## Features

- Horizontal progress bar with six distinct stages
- Animated progress indicator with gradient fill
- Interactive stage indicators that can be clicked to navigate
- Visual feedback for completed, active, and upcoming stages
- Responsive design that works on all screen sizes
- Smooth animations and transitions
- Premium luxury styling with glass morphism effects

## Usage

```tsx
import React, { useState } from 'react';
import ProgressBar, { ProgressStage } from './progressbar';

const MyComponent: React.FC = () => {
  // State to track the current stage
  const [currentStage, setCurrentStage] = useState<ProgressStage>('Panels');
  
  // Handle stage click
  const handleStageClick = (stage: ProgressStage) => {
    setCurrentStage(stage);
    console.log(`Navigated to stage: ${stage}`);
  };
  
  return (
    <div className="p-6">
      <ProgressBar 
        currentStage={currentStage} 
        onStageClick={handleStageClick} 
      />
      
      {/* Your stage-specific content here */}
    </div>
  );
};
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `currentStage` | `ProgressStage` | The current active stage. Must be one of: 'Panels', 'Inverter', 'Batteries', 'Design', 'Overview', 'Completion' |
| `onStageClick` | `(stage: ProgressStage) => void` | Optional callback function that is called when a stage is clicked |
| `className` | `string` | Optional additional CSS classes to apply to the component |

## Types

```tsx
export type ProgressStage = 'Panels' | 'Inverter' | 'Batteries' | 'Design' | 'Overview' | 'Completion';
```

## Example Components

Several example components are provided to demonstrate how to use the ProgressBar:

1. **ProgressBarTest.tsx**: A simple test component that demonstrates the basic usage of the ProgressBar.
2. **ProgressBarDemo.tsx**: A more comprehensive demo that shows how the ProgressBar can be used in a complete UI.
3. **SolarDesignFlow.tsx**: An integration example that shows how the ProgressBar can be used with existing components like SolarPanelShowcase and BatteryShowcase.

## Styling

The ProgressBar component uses Tailwind CSS for styling and Framer Motion for animations. It follows the premium luxury UI theme established in the application, with:

- Dark backgrounds with backdrop blur
- Subtle borders with white/10 opacity
- Gradient effects and glows
- Smooth animations and transitions
- Interactive hover and active states

## Customization

The component can be customized by:

1. Passing additional CSS classes via the `className` prop
2. Modifying the component's internal styling
3. Extending the component with additional props and functionality

## Accessibility

The component is designed with accessibility in mind:

- Interactive elements have appropriate cursor styles
- Color is not the only means of conveying information
- Animations are subtle and not distracting
- Text has sufficient contrast against backgrounds