import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import PostItem from '../../components/PostItem';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => {
  const actual = jest.requireActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (_k: string, opts?: any) => opts?.defaultValue ?? _k,
      i18n: { resolvedLanguage: 'en', language: 'en' },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: jest.fn(),
    },
  };
});

jest.mock('@expo/vector-icons', () => {
  const MockIcon = ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  };
  return { Ionicons: MockIcon };
});

jest.mock('@/components/AccessibleText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock('../../components/ReportModal', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ visible, context }: any) => (
    <View testID="report-modal">
      <Text testID="report-visible">{String(Boolean(visible))}</Text>
      <Text testID="report-context">{context?.type ?? 'none'}</Text>
    </View>
  );
});

jest.mock('../../components/CommentItemDisplay', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ onReportComment, comment }: any) => (
    <View>
      <Text>{comment?.content ?? 'comment'}</Text>
      <TouchableOpacity
        testID="report-comment-btn"
        onPress={() => onReportComment?.(comment)}
      >
        <Text>Report comment</Text>
      </TouchableOpacity>
    </View>
  );
});

const basePost = {
  id: 1,
  title: 'bob',
  content: 'Offensive post',
  likes: 0,
  comments: 1,
  photoUrl: null,
  likedByUser: false,
  savedByUser: false,
  createdAt: null,
};

const baseComment = {
  commentId: 2,
  username: 'charlie',
  content: 'Bad comment',
  createdAt: new Date().toISOString(),
};

const renderPostItem = () =>
  render(
    <PostItem
      post={basePost}
      cardBackgroundColor="#fff"
      iconColor="#000"
      textColor="#000"
      commentInputBorderColor="#ccc"
      commentInputTextColor="#000"
      commentInputPlaceholderColor="#888"
      commentInputBackgroundColor="#eee"
      onLikePress={jest.fn()}
      onSavePress={jest.fn()}
      userType="user"
      loggedInUsername="alice"
      isExpanded
      commentsList={[baseComment]}
      isLoadingComments={false}
      commentInputText=""
      isPostingComment={false}
      onToggleComments={jest.fn()}
      onCommentInputChange={jest.fn()}
      onPostComment={jest.fn()}
      onDeleteComment={jest.fn()}
      onTriggerEditComment={jest.fn()}
      editingCommentDetailsForPost={null}
      onEditCommentContentChange={jest.fn()}
      onSaveEditedCommentForPost={jest.fn()}
      onCancelCommentEdit={jest.fn()}
      isSubmittingCommentEditForPost={false}
    />
  );

describe('Report modal triggers', () => {
  it('opens report modal when reporting a non-owner post', () => {
    renderPostItem();
    fireEvent.press(screen.getByText('Report'));
    expect(screen.getByTestId('report-visible').props.children).toBe('true');
    expect(screen.getByTestId('report-context').props.children).toBe('post');
  });

  it('opens report modal when reporting a comment', () => {
    renderPostItem();
    fireEvent.press(screen.getByTestId('report-comment-btn'));
    expect(screen.getByTestId('report-visible').props.children).toBe('true');
    expect(screen.getByTestId('report-context').props.children).toBe('comment');
  });
});
