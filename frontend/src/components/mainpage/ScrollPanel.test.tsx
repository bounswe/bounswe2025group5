import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ScrollPanel from '@/components/mainpage/ScrollPanel';

describe('ScrollPanel', () => {
  it('renders title, description, and children', () => {
    render(
      <ScrollPanel title="News" description="Latest updates">
        <p>Child content</p>
      </ScrollPanel>
    );

    expect(screen.getByText('News')).toBeInTheDocument();
    expect(screen.getByText('Latest updates')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('applies custom class names to wrapper and content', () => {
    const { container } = render(
      <ScrollPanel title="Panel" className="wrapper-class" contentClassName="content-class">
        <div>content</div>
      </ScrollPanel>
    );

    const card = container.querySelector('.wrapper-class');
    const content = container.querySelector('.content-class');
    expect(card).not.toBeNull();
    expect(content).not.toBeNull();
  });
});

