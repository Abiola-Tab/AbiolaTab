(() => {
  'use strict';

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') !== 'true';
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('open', open);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    }));
  }

  const year = document.querySelector('#current-year');
  if (year) year.textContent = new Date().getFullYear();

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  const contactForm = document.querySelector('#contact-form');
  const contactStatus = document.querySelector('#contact-status');
  const chatWindow = document.querySelector('#chat-window');
  const chatLauncher = document.querySelector('#chat-launcher');
  const chatForm = document.querySelector('#chat-form');
  const chatMessages = document.querySelector('#chat-messages');
  const chatNotice = document.querySelector('#chat-notice');
  const chatInput = document.querySelector('#chat-input');
  const chatClose = document.querySelector('.chat-close');
  const chatHeading = document.querySelector('.chat-title strong');
  const chatSubheading = document.querySelector('.chat-title small');
  let history = [];
  let conversationToken = null;
  try {
    conversationToken = localStorage.getItem('standout-management-token');
  } catch (_) {
    conversationToken = null;
  }
  let restoreConversationHistory = Boolean(conversationToken);
  let lastMessageId = 0;
  let pollTimer = null;
  let sending = false;

  function setManagementMode() {
    if (chatHeading) chatHeading.textContent = 'Chat with management';
    if (chatSubheading) chatSubheading.textContent = 'Your enquiry goes directly to the team';
  }
  if (conversationToken) setManagementMode();

  function setChatOpen(open) {
    if (!chatWindow || !chatLauncher) return;
    chatWindow.hidden = !open;
    chatLauncher.setAttribute('aria-expanded', String(open));
    chatLauncher.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
    if (open) chatInput?.focus();
    else chatLauncher.focus();
  }
  chatLauncher?.addEventListener('click', () => setChatOpen(chatWindow.hidden));
  chatClose?.addEventListener('click', () => setChatOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && chatWindow && !chatWindow.hidden) setChatOpen(false);
  });

  function addBubble(role, text) {
    if (!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function pollConversation() {
    if (!conversationToken) return;
    try {
      const response = await fetch(`/api/management/conversations/${encodeURIComponent(conversationToken)}?after=${encodeURIComponent(lastMessageId)}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });
      if (!response.ok) return;
      const data = await response.json();
      (data.messages || []).forEach(message => {
        const id = Number(message.id) || 0;
        if (id > lastMessageId) {
          lastMessageId = id;
          if (message.sender === 'visitor') {
            if (restoreConversationHistory) addBubble('user', message.body || '');
          } else {
            addBubble('assistant', message.body || '');
          }
        }
      });
      restoreConversationHistory = false;
      if (data.status === 'resolved' && chatNotice) chatNotice.textContent = 'This enquiry has been marked resolved. Send a new enquiry through the form to get back in touch.';
      else if (chatNotice && conversationToken) chatNotice.textContent = 'This chat is connected to your enquiry. Our team can reply here.';
    } catch (_) {
      // A temporary polling failure should not interrupt the conversation.
    }
  }
  function startPolling() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollConversation();
    pollTimer = window.setInterval(pollConversation, 12000);
  }

  contactForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const submit = contactForm.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(contactForm).entries());
    contactStatus.textContent = 'Sending your enquiry…';
    contactStatus.className = 'form-status';
    submit.disabled = true;
    try {
      const response = await fetch('/api/management/conversations', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}) },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'We couldn’t send your enquiry right now. Please try again.');
      conversationToken = data.token;
      setManagementMode();
      try {
        localStorage.setItem('standout-management-token', conversationToken);
      } catch (_) {
        // The conversation remains active for this page even if storage is unavailable.
      }
      lastMessageId = 0;
      if (data.messages?.length) {
        data.messages.forEach(message => {
          lastMessageId = Math.max(lastMessageId, Number(message.id) || 0);
          addBubble(message.sender === 'visitor' ? 'user' : 'assistant', message.body || '');
        });
      }
      contactStatus.className = 'form-status success';
      contactStatus.textContent = 'Your enquiry is with our team. We’ll follow up using the contact details you provided.';
      contactForm.reset();
      if (conversationToken) {
        startPolling();
        setChatOpen(true);
        chatNotice.textContent = 'This chat is connected to your enquiry. Our team can reply here.';
        addBubble('assistant', 'Your enquiry has reached the STANDOUT team. You can leave a follow-up message here.');
      }
    } catch (error) {
      contactStatus.className = 'form-status error';
      contactStatus.textContent = error.message || 'Something went wrong. Please try again or call 0731 157 929.';
    } finally {
      submit.disabled = false;
    }
  });

  chatForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message || sending) return;
    sending = true;
    chatInput.value = '';
    chatInput.disabled = true;
    addBubble('user', message);
    if (conversationToken) {
      try {
        const response = await fetch(`/api/management/conversations/${encodeURIComponent(conversationToken)}/messages`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}) },
          body: JSON.stringify({ message })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || data.message || 'That message could not be sent.');
        if (data.message) {
          lastMessageId = Math.max(lastMessageId, Number(data.message.id) || 0);
        }
        if (chatNotice) chatNotice.textContent = 'Sent to the STANDOUT team.';
        pollConversation();
      } catch (error) {
        addBubble('assistant', error.message || 'We couldn’t send that message. Please try again.');
      }
    } else {
      try {
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}) },
          body: JSON.stringify({ message, history: history.slice(-12) })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || data.message || 'The assistant is unavailable right now.');
        const reply = data.reply || 'I can help with general questions. For a detailed project enquiry, please send us a message using the form.';
        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: reply });
        addBubble('assistant', reply);
        if (chatNotice) chatNotice.textContent = '';
      } catch (error) {
        addBubble('assistant', error.message || 'I’m having trouble connecting. Please try again or use the enquiry form.');
      }
    }
    sending = false;
    chatInput.disabled = false;
    chatInput.focus();
  });

  if (conversationToken) startPolling();
})();
