import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const ChubbyAIChatModal = ({ visible, onClose, routeContext }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: "👋 Hi! I'm Chubby AI, your smart travel optimization agent. Ask me anything about current traffic, surge alerts, or how to get the cheapest fare for this route!",
    },
  ]);
  const [inputText, setInputText] = useState('');

  const quickPrompts = [
    'Which option is cheapest?',
    'Why is Uber surging right now?',
    'Is Metro + Cab faster?',
    'Show me total estimated savings',
  ];

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      let reply = "Based on our live telemetry matrix, SmartRide AI currently delivers the highest value score (0.94) by minimizing peak-hour platform commissions.";
      const lower = text.toLowerCase();

      if (lower.includes('cheapest') || lower.includes('lowest')) {
        reply = "💡 For this 34 km route, SmartRide Moto (₹358) or Rapido Bike (₹395) is lowest. For cabs, SmartRide Cab+Metro combo saves ₹280 vs standard Uber Go.";
      } else if (lower.includes('surge') || lower.includes('uber') || lower.includes('ola')) {
        reply = "⚡ Current demand spike detected around Avadi/Porur corridor (+1.35x surge on Uber/Ola). Namma Yatri and SmartRide AI operate on 0% surge caps.";
      } else if (lower.includes('metro') || lower.includes('faster')) {
        reply = "🚆 Taking SmartRide Cab to nearest Metro Station cuts total journey time by 18 minutes during evening peak congestion.";
      } else if (lower.includes('saving')) {
        reply = "💰 Choosing SmartRide AI over peak Uber rates saves you approximately ₹245 to ₹310 on this single trip.";
      }

      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: reply }]);
    }, 450);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.aiHeaderTitleRow}>
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>🤖</Text>
              </View>
              <View>
                <Text style={styles.aiName}>Chubby AI Assistant</Text>
                <Text style={styles.aiStatus}>● Real-Time Route Intelligence</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Prompt Chips */}
          <View style={styles.chipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {quickPrompts.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSend(prompt)}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages */}
          <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesScroll}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.messageBubble,
                  m.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    m.sender === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {m.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask Chubby AI about routes or fares..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity onPress={() => handleSend()} style={styles.sendBtn}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '75%',
    backgroundColor: theme.colors.bgSurface,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  aiHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 216, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.brandCyan,
  },
  botAvatarText: {
    fontSize: 20,
  },
  aiName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  aiStatus: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  chipsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.3)',
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.brandCyan,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesScroll: {
    paddingVertical: 12,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: theme.radii.lg,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.brandIndigo,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiText: {
    color: theme.colors.textMain,
  },
  userText: {
    color: '#FFFFFF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.full,
    paddingHorizontal: 16,
    color: theme.colors.textMain,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.brandCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
});
