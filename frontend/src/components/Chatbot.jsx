import React, { useState } from 'react';
import Messages from './Messages';


const Chatbot = () => {
    
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Hello!  How can I help you today?' },
    ]);
    const [inputValue, setInputValue] = useState('');

    const handleSend = async () => {
        if (inputValue.trim() === '') return;

        // Add user message
        const userMessage = {
            id: messages.length + 1,
            sender: 'user',
            text: inputValue,
        };
        setMessages([...messages, userMessage]);

        const userInput = inputValue;

        setInputValue('');

        const API_URL = import.meta.env.VITE_API_URL;

        try {

            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userInput }),
            });

            const data = await response.json();

            const botMessage = {
                id: messages.length + 2,
                sender: 'bot',
                text: data.reply,
            }

            setMessages((prevMessages) => [...prevMessages, botMessage]);

        }

        catch (error) {
            console.error('Error communicating with backend:', error);

            const errorMessage = {
                id: messages.length + 2,
                sender: 'bot',
                text: 'Sorry, I could not connect to the server. Please try again!'
            }

            setMessages((prevMessages) => [...prevMessages, errorMessage])
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '600px',
                maxWidth: '600px',
                margin: '0 auto',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '18px',
                }}
            >
                Bingo Chat
            </div>

            {/* Messages Container */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                }}
            >
                {messages.map((message) => (
                    <Messages key={message.id} sender={message.sender} text={message.text} />
                ))}
            </div>

            {/* Input Area */}
            <div
                style={{
                    display: 'flex',
                    padding: '16px',
                    borderTop: '1px solid #ddd',
                    backgroundColor: 'white',
                }}
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        marginRight: '8px',
                    }}
                />
                <button
                    onClick={handleSend}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
