import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CreateOrEditGoalDialog from './CreateOrEditGoalDialog';

function renderDialog(
  props: Partial<ComponentProps<typeof CreateOrEditGoalDialog>> = {},
) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onOpenChange = vi.fn();

  render(
    <CreateOrEditGoalDialog
      open
      onSubmit={onSubmit}
      onOpenChange={onOpenChange}
      {...props}
    />,
  );

  return { onSubmit, onOpenChange };
}

describe('CreateOrEditGoalDialog', () => {
  it('shows provided initial values and copy when dialog opens', () => {
    renderDialog({
      initial: { type: 'PAPER', duration: 21, restrictionAmountGrams: 500 },
    });

    const typeSelect = screen.getByLabelText<HTMLSelectElement>(/type/i);
    const durationInput = screen.getByLabelText<HTMLInputElement>(
      /duration/i,
    );
    const restrictionInput = screen.getByLabelText<HTMLInputElement>(
      /restriction amount/i,
    );

    expect(screen.getByText(/edit goal/i)).toBeInTheDocument();
    expect(screen.getByText(/update your progress/i)).toBeInTheDocument();
    expect(typeSelect.value).toBe('PAPER');
    expect(durationInput.value).toBe('21');
    expect(restrictionInput.value).toBe('500');
  });

  it('submits the form with user-edited values and closes the dialog', async () => {
    const user = userEvent.setup();
    const { onSubmit, onOpenChange } = renderDialog();

    await user.selectOptions(screen.getByLabelText(/type/i), 'METAL');
    const durationInput = screen.getByLabelText<HTMLInputElement>(
      /duration/i,
    );
    await user.clear(durationInput);
    await user.type(durationInput, '14');

    const restrictionInput = screen.getByLabelText<HTMLInputElement>(
      /restriction amount/i,
    );
    await user.clear(restrictionInput);
    await user.type(restrictionInput, '1200');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        type: 'METAL',
        duration: 14,
        restrictionAmountGrams: 1200,
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables the save button when inputs are invalid', async () => {
    const user = userEvent.setup();
    renderDialog();

    const durationInput = screen.getByLabelText<HTMLInputElement>(
      /duration/i,
    );
    await user.clear(durationInput);
    await user.type(durationInput, '0');

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });
});

