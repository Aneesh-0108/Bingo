import React from 'react';

const Messages = ({ sender, text }) => {
    const isUser = sender === 'user';

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
            }}
        >
            <div
                style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isUser ? '#007bff' : '#e9ecef',
                    color: isUser ? 'white' : '#212529',
                    wordWrap: 'break-word',
                }}
            >
                <div
                    style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        opacity: 0.8,
                    }}
                >
                    {isUser ? 'You' : 'Bot'}
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                    {text}
                </div>
            </div>
        </div>
    );
};

export default Messages;