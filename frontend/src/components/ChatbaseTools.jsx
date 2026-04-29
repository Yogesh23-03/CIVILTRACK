import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { askChatbotComplaintQuestion } from '../services/apiService';

const buildQuestion = (args = {}) => {
  if (typeof args === 'string') return args;
  return (
    args.question ||
    args.message ||
    args.complaintName ||
    args.title ||
    args.complaintTitle ||
    ''
  );
};

const ChatbaseTools = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!window.chatbase) return;

    window.chatbase('identify', {
      user_id: user?.id || 'guest',
      user_metadata: {
        name: user?.name || 'Guest',
        email: user?.email || '',
        role: user?.role || 'guest'
      }
    });

    window.chatbase('registerTools', {
      check_complaint_status: async (args = {}) => {
        if (!user) {
          return {
            status: 'error',
            error: 'Please login first so I can check your complaints.'
          };
        }

        const question = buildQuestion(args);
        if (!question) {
          return {
            status: 'error',
            error: 'Please provide the complaint name, complaint ID, or issue type.'
          };
        }

        try {
          const result = await askChatbotComplaintQuestion(question);
          return {
            status: 'success',
            data: {
              answer: result.answer,
              count: result.count,
              complaints: result.complaints
            }
          };
        } catch (error) {
          return {
            status: 'error',
            error: error.response?.data?.message || 'Unable to check complaint status right now.'
          };
        }
      }
    });
  }, [user]);

  return null;
};

export default ChatbaseTools;
