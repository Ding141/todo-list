(function () {
  const { esc, icon, uid, PALETTE, PRIO, normRange } = App;
  const modal = document.getElementById('modal');
  const form = document.getElementById('modalForm');
  let lastFocus = null;

  function open(html, onSubmit, onDelete) {
    lastFocus = document.activeElement;
    form.innerHTML = html;
    form.onsubmit = (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(form));
      if (!String(v.title || '').trim()) { form.elements.title.focus(); return; }
      onSubmit(v);
      close();
    };
    const del = form.querySelector('[data-del]');
    if (del) del.onclick = () => { if (onDelete()) close(); };
    modal.hidden = false;
    form.elements.title.focus();
  }

  function close() {
    modal.hidden = true;
    form.innerHTML = '';
    form.onsubmit = null;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  modal.addEventListener('mousedown', (e) => { if (e.target === modal) close(); });
  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return close();
    const sw = e.target.closest('.sw');
    if (!sw) return;
    form.querySelectorAll('.sw.on').forEach((x) => x.classList.remove('on'));
    sw.classList.add('on');
    form.elements.color.value = sw.dataset.val;
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  const actions = (creating, canDelete, labels) => `
    <div class="modal-actions">
      ${!creating && canDelete ? '<button type="button" class="btn btn-quiet btn-danger" data-del>删除</button>' : '<span></span>'}
      <div class="right">
        <button type="button" class="btn btn-quiet" data-close>取消</button>
        <button class="btn btn-primary">${creating ? labels[0] : labels[1]}</button>
      </div>
    </div>`;

  App.modals = {
    board(board, done, remove) {
      const creating = !board;
      const color = board ? board.color : PALETTE[0];
      open(`
        <h3>${creating ? '新建板块' : '编辑板块'}</h3>
        <div class="row"><label>名称</label><input class="field" name="title" maxlength="40" value="${esc(board ? board.title : '')}" placeholder="例如：课程" /></div>
        <div class="row"><label>一句话描述</label><input class="field" name="desc" maxlength="80" value="${esc(board ? board.desc : '')}" placeholder="可选" /></div>
        <div class="row"><label>颜色</label>
          <div class="swatches">${PALETTE.map((p) => `<button type="button" class="sw${p === color ? ' on' : ''}" style="--sc:var(--c-${p})" data-val="${p}" aria-label="${p}"></button>`).join('')}</div>
          <input type="hidden" name="color" value="${color}" />
        </div>
        ${actions(creating, true, ['创建', '保存'])}`,
      (v) => done({ title: v.title.trim(), desc: (v.desc || '').trim(), color: v.color }),
      () => remove());
    },

    item(item, done, remove) {
      const creating = !item;
      open(`
        <h3>${creating ? '新建事项' : '编辑事项'}</h3>
        <div class="row"><label>事项</label><input class="field" name="title" maxlength="120" value="${esc(item ? item.title : '')}" placeholder="要完成的一件事" /></div>
        <div class="row"><label>备注</label><textarea class="field" name="note" maxlength="500" placeholder="可选">${esc(item ? item.note : '')}</textarea></div>
        <div class="row2 row">
          <div><label>截止日期</label><input class="field mono" type="date" name="due" value="${item && item.due ? item.due : ''}" /></div>
          <div><label>优先级</label><select class="select field" name="prio">
            ${['low', 'mid', 'high'].map((p) => `<option value="${p}"${item && item.prio === p ? ' selected' : ''}>${PRIO[p]}</option>`).join('')}
          </select></div>
        </div>
        ${actions(creating, true, ['添加', '保存'])}`,
      (v) => done({ title: v.title.trim(), note: (v.note || '').trim(), due: v.due || '', prio: v.prio }),
      () => remove());
    },

    sub(sub, done, remove) {
      open(`
        <h3>编辑子任务</h3>
        <div class="row"><label>子任务</label><input class="field" name="title" maxlength="120" value="${esc(sub.title)}" /></div>
        <div class="row2 row">
          <div><label>开始</label><input class="field mono" type="date" name="start" value="${sub.start || ''}" /></div>
          <div><label>结束</label><input class="field mono" type="date" name="end" value="${sub.end || ''}" /></div>
        </div>
        ${actions(false, true, ['', '保存'])}`,
      (v) => { const [start, end] = normRange(v.start, v.end); done({ title: v.title.trim(), start, end }); },
      () => remove());
    },

    // used for sub-task creation from the inline form
    newSub(v) {
      const [start, end] = normRange(v.start, v.end);
      return { id: uid(), title: String(v.title).trim(), done: false, start, end };
    },

    close,
  };
})();
