import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import ReportModal from '../../components/ReportModal';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      // Handle interpolation for test assertions
      let result = opts?.defaultValue ?? key;
      if (opts && typeof result === 'string') {
        Object.keys(opts).forEach((k) => {
          if (k !== 'defaultValue') {
            result = result.replace(`{{${k}}}`, opts[k]);
          }
        });
      }
      return result;
    },
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const MockIcon = ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID ?? `icon-${name}`}>{name}</Text>;
  };
  return { Ionicons: MockIcon };
});

jest.mock('@/components/AccessibleText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

// Mock API client
const mockSubmitReport = jest.fn();
const mockGetStoredUsername = jest.fn();

jest.mock('../../services/apiClient', () => ({
  submitReport: (...args: any[]) => mockSubmitReport(...args),
  getStoredUsername: () => mockGetStoredUsername(),
}));

// Spy on Alert
jest.spyOn(Alert, 'alert');

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  context: {
    type: 'post' as const,
    objectId: 123,
    title: 'Test Post',
    snippet: 'This is offensive content',
  },
  surfaceColor: '#FFFFFF',
  textColor: '#000000',
  accentColor: '#007AFF',
};

describe('ReportModal Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStoredUsername.mockResolvedValue('testuser');
    mockSubmitReport.mockResolvedValue(undefined);
  });

  it('renders report modal with post context', () => {
    render(<ReportModal {...defaultProps} />);

    expect(screen.getByText('Report Post')).toBeTruthy();
    expect(screen.getByText('Post: Test Post')).toBeTruthy();
    expect(screen.getByText('"This is offensive content"')).toBeTruthy();
  });

  it('renders report modal with comment context', () => {
    const commentProps = {
      ...defaultProps,
      context: {
        type: 'comment' as const,
        objectId: 456,
        username: 'baduser',
        snippet: 'Offensive comment',
      },
    };
    render(<ReportModal {...commentProps} />);

    expect(screen.getByText('Report Comment')).toBeTruthy();
    expect(screen.getByText('Comment by baduser')).toBeTruthy();
  });

  it('displays all report reason options', () => {
    render(<ReportModal {...defaultProps} />);

    expect(screen.getByText('Spam')).toBeTruthy();
    expect(screen.getByText('Hate Speech')).toBeTruthy();
    expect(screen.getByText('Harm / Violence')).toBeTruthy();
    expect(screen.getByText('Other')).toBeTruthy();
  });

  it('submit button is disabled when no reason is selected', () => {
    render(<ReportModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: 'Submit report' });
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('submit button is enabled when a reason is selected', () => {
    render(<ReportModal {...defaultProps} />);

    fireEvent.press(screen.getByText('Spam'));

    const submitButton = screen.getByRole('button', { name: 'Submit report' });
    expect(submitButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('allows selecting different report reasons', () => {
    render(<ReportModal {...defaultProps} />);

    // Select Spam
    fireEvent.press(screen.getByText('Spam'));
    // Select Hate Speech (should deselect Spam)
    fireEvent.press(screen.getByText('Hate Speech'));

    const submitButton = screen.getByRole('button', { name: 'Submit report' });
    expect(submitButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('allows entering details in the text input', () => {
    render(<ReportModal {...defaultProps} />);

    const detailsInput = screen.getByLabelText('Details about what happened');
    fireEvent.changeText(detailsInput, 'This user has been harassing me');

    expect(detailsInput.props.value).toBe('This user has been harassing me');
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    render(<ReportModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByRole('button', { name: 'Close modal' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is pressed', () => {
    const onClose = jest.fn();
    render(<ReportModal {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('submits report with correct payload for post', async () => {
    render(<ReportModal {...defaultProps} />);

    fireEvent.press(screen.getByText('Spam'));
    
    const detailsInput = screen.getByLabelText('Details about what happened');
    fireEvent.changeText(detailsInput, 'This is spam content');

    fireEvent.press(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => {
      expect(mockSubmitReport).toHaveBeenCalledWith({
        reporterName: 'testuser',
        description: 'This is spam content',
        type: 'Spam',
        contentType: 'Post',
        objectId: 123,
      });
    });
  });

  it('submits report with correct payload for comment', async () => {
    const commentProps = {
      ...defaultProps,
      context: {
        type: 'comment' as const,
        objectId: 456,
        username: 'baduser',
        snippet: 'Offensive comment',
      },
    };
    render(<ReportModal {...commentProps} />);

    fireEvent.press(screen.getByText('Hate Speech'));
    fireEvent.press(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => {
      expect(mockSubmitReport).toHaveBeenCalledWith({
        reporterName: 'testuser',
        description: 'Hate Speech report',
        type: 'Hate Speech',
        contentType: 'Comment',
        objectId: 456,
      });
    });
  });

  it('submits report with Violence type for Harm selection', async () => {
    render(<ReportModal {...defaultProps} />);

    fireEvent.press(screen.getByText('Harm / Violence'));
    fireEvent.press(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => {
      expect(mockSubmitReport).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Violence',
        })
      );
    });
  });

  it('shows success alert after successful submission', async () => {
    render(<ReportModal {...defaultProps} />);

    fireEvent.press(screen.getByText('Spam'));
    fireEvent.press(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Report submitted',
        'Thank you for letting us know. Our moderators will review it shortly.',
        expect.any(Array)
      );
    });
  });

  it('shows error alert when user is not logged in', async () => {
    mockGetStoredUsername.mockResolvedValue(null);

    render(<ReportModal {...defaultProps} />);

    fireEvent.press(screen.getByText('Spam'));
    fireEvent.press(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'You must be logged in to submit a report.'
      );
    });

    expect(mockSubmitReport).not.toHaveBeenCalled();
  });

  it('shows error alert when API call fails', async () => {
    mockSubmitReport.mockRejectedValue(new Error('Network error'));

    render(<ReportModal {...defaultProps} />);

    fireEvent.press(screen.getByText('Spam'));
    fireEvent.press(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to submit report. Please try again later.'
      );
    });
  });

  it('disables submit button while submitting', async () => {
    // Make submitReport hang to test loading state
    mockSubmitReport.mockImplementation(() => new Promise(() => {}));

    render(<ReportModal {...defaultProps} />);

    fireEvent.press(screen.getByText('Spam'));
    fireEvent.press(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: 'Submit report' });
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('resets state when modal becomes invisible', () => {
    const { rerender } = render(<ReportModal {...defaultProps} />);

    // Select a reason and enter details
    fireEvent.press(screen.getByText('Spam'));
    const detailsInput = screen.getByLabelText('Details about what happened');
    fireEvent.changeText(detailsInput, 'Some details');

    // Close modal
    rerender(<ReportModal {...defaultProps} visible={false} />);

    // Reopen modal
    rerender(<ReportModal {...defaultProps} visible={true} />);

    // State should be reset
    const submitButton = screen.getByRole('button', { name: 'Submit report' });
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    
    const newDetailsInput = screen.getByLabelText('Details about what happened');
    expect(newDetailsInput.props.value).toBe('');
  });
});
