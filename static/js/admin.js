(() => {
  'use strict';

  const filterButtons = document.querySelectorAll('[data-filter]');
  const conversationItems = document.querySelectorAll('.conversation-item');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      conversationItems.forEach(item => {
        item.hidden = filter !== 'all' && item.dataset.status !== filter;
      });
    });
  });

  document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', event => {
      if (!window.confirm(form.dataset.confirm)) event.preventDefault();
    });
  });

  const threadBody = document.querySelector('#thread-body');
  if (threadBody) {
    threadBody.scrollTop = threadBody.scrollHeight;
    const conversationToken = threadBody.dataset.conversationToken;
    const initialMessages = [...threadBody.querySelectorAll('[data-message-id]')];
    let lastMessageId = Number(initialMessages.at(-1)?.dataset.messageId) || 0;
    let polling = false;

    const refreshThread = async () => {
      if (!conversationToken || polling) return;
      polling = true;
      try {
        const response = await fetch(`/api/management/conversations/${encodeURIComponent(conversationToken)}?after=${lastMessageId}`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin'
        });
        if (!response.ok) return;
        const data = await response.json();
        (data.messages || []).forEach(message => {
          const id = Number(message.id) || 0;
          if (id <= lastMessageId) return;
          lastMessageId = id;
          const article = document.createElement('article');
          article.className = `message ${message.sender === 'visitor' ? 'visitor' : 'admin'}`;
          article.dataset.messageId = String(id);
          const meta = document.createElement('div');
          meta.className = 'message-meta';
          const author = document.createElement('span');
          author.textContent = message.sender === 'visitor' ? 'Website visitor' : 'STANDOUT B&C';
          const time = document.createElement('time');
          time.textContent = message.created_at ? new Date(message.created_at).toLocaleString() : '';
          const bubble = document.createElement('div');
          bubble.className = 'message-box';
          bubble.textContent = message.body || '';
          meta.append(author, time);
          article.append(meta, bubble);
          threadBody.appendChild(article);
          threadBody.scrollTop = threadBody.scrollHeight;
        });
      } catch (_) {
        // Keep the existing thread visible if polling is temporarily unavailable.
      } finally {
        polling = false;
      }
    };

    window.setInterval(refreshThread, 7000);
  }

  const reply = document.querySelector('#reply-message');
  if (reply) {
    reply.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (reply.value.trim()) reply.form.requestSubmit();
      }
    });
  }
})();
