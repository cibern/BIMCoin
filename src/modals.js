// modals.js

export function showModal(message) {
  let modal = document.getElementById('status-modal');
  let content = document.getElementById('status-modal-content');

  if (!modal) {
    // Crear el modal si no existeix
    modal = document.createElement('div');
    modal.id = 'status-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';

    content = document.createElement('div');
    content.id = 'status-modal-content';
    content.style.backgroundColor = '#fff';
    content.style.padding = '20px';
    content.style.borderRadius = '10px';
    content.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    content.style.maxWidth = '400px';
    content.style.textAlign = 'center';
    content.innerText = message;

    modal.appendChild(content);
    document.body.appendChild(modal);
  } else {
    content.innerText = message;
    modal.style.display = 'flex';
  }
}

export function hideModal() {
  const modal = document.getElementById('status-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}
