/*
 * Artemidos - Notebook
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Notes kept on the device, filed under categories the user names. It exists
 * because the rest of the app answers questions and this is where the answers
 * are written down: a plate number, a frequency someone read out, a grid, the
 * name of a contact, a description of a vehicle that drove past twice.
 *
 * Everything is local storage and nothing leaves the phone. That is the point,
 * and also the warning: a note on a device that can be taken is a note that can
 * be read. Write accordingly.
 */
(function (global) {
  'use strict';

  var KEY = 'notebook.notes';
  var CATS_KEY = 'notebook.cats';

  var DEFAULT_CATS = ['General', 'Observation', 'Contacts', 'Comms', 'Routes'];

  function notes() { return A.store.get(KEY, []); }
  function setNotes(n) { A.store.set(KEY, n); }
  function cats() {
    var c = A.store.get(CATS_KEY, null);
    if (!c || !c.length) { c = DEFAULT_CATS.slice(); A.store.set(CATS_KEY, c); }
    return c;
  }
  function setCats(c) { A.store.set(CATS_KEY, c); }

  function stamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + '  ' + p(d.getHours()) + 'h' + p(d.getMinutes());
  }
  function uid() { return 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }

  /* ── the editor, as a sheet over the list ── */
  var DRAFT_KEY = 'notebook.draft';

  function editNote(note, onSaved) {
    var isNew = !note;
    var draft = note ? { id: note.id, cat: note.cat, title: note.title, body: note.body, at: note.at }
                     : { id: uid(), cat: A.store.get('notebook.lastCat', cats()[0]), title: '', body: '', at: stamp() };

    /* THE DRAFT IS SAVED AS IT IS TYPED. Whatever dismisses this sheet - back,
       a stray tap, the app being killed by Android while the keyboard is up -
       the text is already on disk and comes back next time. Losing written
       work is the one failure a notebook must not have, and chasing the exact
       dismissal path phone by phone was never going to catch them all. */
    if (isNew) {
      var kept = A.store.get(DRAFT_KEY, null);
      if (kept && (kept.title || kept.body)) draft = kept;
    }
    function keepDraft() { if (isNew) A.store.set(DRAFT_KEY, draft); }
    function dropDraft() { A.store.del(DRAFT_KEY); }

    var ov = A.el('.place-ov');
    var box = A.el('.place-box');

    /* Pull the current values straight off the inputs. The oninput handlers
       keep `draft` in step as you type, but on a phone the FINAL keystroke can
       still be in the keyboard's compose buffer when Save is tapped, so draft
       is one character behind - or, with a swipe/autocorrect word, empty. That
       was the note that "would not save": it had been typed but not committed
       to draft yet. Reading the DOM at the moment of Save cannot be stale. */
    function sync() {
      if (titleF && titleF.input) draft.title = titleF.input.value;
      if (ta) draft.body = ta.value;
      keepDraft();
    }
    function dirty() {
      sync();
      if (!isNew) return draft.title !== note.title || draft.body !== note.body || draft.cat !== note.cat;
      return !!(draft.title.trim() || draft.body.trim());
    }
    function close(force) {
      if (!force && dirty() && !confirm('Discard this note?')) return;
      dropDraft();
      ov.remove();
    }
    function commit() {
      sync();
      if (!draft.title.trim() && !draft.body.trim()) { A.toast('Nothing to save'); return; }
      if (!draft.title.trim()) draft.title = draft.body.trim().split(/\r?\n/)[0].slice(0, 40);
      draft.at = stamp();
      var all = notes();
      var i = -1;
      all.forEach(function (n, k) { if (n.id === draft.id) i = k; });
      if (i >= 0) all[i] = draft; else all.unshift(draft);
      setNotes(all);
      /* Prove it landed. Writing and repainting without checking is how a note
         can appear to save and simply not exist. */
      var back = notes();
      var saved = back.some(function (n) { return n.id === draft.id && n.title === draft.title && n.body === draft.body; });
      console.log('notebook: save id=' + draft.id + ' titleLen=' + draft.title.length +
                  ' bodyLen=' + draft.body.length + ' count=' + back.length +
                  ' verified=' + saved + ' storeOk=' + A.store.ok() +
                  ' usage=' + A.store.usage());
      if (!saved) {
        A.toast('Could not save: ' + (A.store.lastError || 'storage rejected the note'));
        return;
      }
      A.store.set('notebook.lastCat', draft.cat);
      /* A FILTER MUST NEVER SWALLOW WHAT YOU JUST WROTE.
         The category chip and the search box are remembered between visits, so
         a category picked once - or a search left in the box - quietly hid
         every new note written afterwards. The note was saved and verified;
         it simply did not match the filter. Saving now clears the filter, so
         what you just wrote is always the thing you see. */
      var view = A.store.get('notebook.view', null);
      if (view && (view.cat !== 'All' || String(view.q || '').trim())) {
        A.store.set('notebook.view', { cat: 'All', q: '' });
      }
      dropDraft();
      ov.remove();
      A.haptic();
      A.toast('Saved');
      onSaved && onSaved();
    }

    /* Save lives in the HEADER, which never scrolls and is never covered by
       the on-screen keyboard. It used to sit at the foot of the scrolling
       body, where the keyboard hid it: the note was typed, Save could not be
       reached, a tap outside dismissed the sheet and the work was lost. */
    var head = A.el('.place-head');
    head.appendChild(A.el('button.place-x', { html: Icons.svg('close'), onclick: function () { close(false); } }));
    head.appendChild(A.el('span.place-title', { text: isNew ? 'New note' : 'Edit note' }));
    head.appendChild(A.el('button.nb-save', { html: Icons.svg('check') + ' Save', onclick: commit }));
    box.appendChild(head);

    var body = A.el('.nb-edit');
    box.appendChild(body);

    body.appendChild(A.UI.select({
      label: 'Category', value: draft.cat,
      options: cats().map(function (c) { return { value: c, label: c }; }),
      onchange: function (e) { draft.cat = e.target.value; keepDraft(); }
    }));
    var titleF = A.UI.field({
      label: 'Title', value: draft.title, placeholder: 'What this is',
      oninput: function (e) { draft.title = e.target.value; keepDraft(); }
    });
    body.appendChild(titleF);

    body.appendChild(A.el('span.fld-lab', { text: 'Note' }));
    var ta = A.el('textarea.fld-in', {
      rows: '8', placeholder: 'Write it down…',
      style: { width: '100%', resize: 'vertical', minHeight: '160px', lineHeight: '1.5' }
    });
    ta.value = draft.body;
    ta.addEventListener('input', function () { draft.body = ta.value; keepDraft(); });
    body.appendChild(ta);

    /* a second Save at the foot, for when the keyboard is down */
    body.appendChild(A.el('button.btn.block.sem-go', {
      html: Icons.svg('check') + ' Save note', style: { marginTop: '12px' }, onclick: commit
    }));

    ov.appendChild(box);
    /* a stray tap on the backdrop must not throw away typing */
    ov.addEventListener('click', function (e) { if (e.target === ov) close(false); });
    /* the Android back button closes THIS sheet, asking first if there is
       unsaved text, instead of navigating the app out from under it */
    ov._onBack = function () { close(false); };
    document.body.appendChild(ov);
    setTimeout(function () { (isNew ? titleF.input : ta).focus(); }, 60);
  }

  /* ── categories editor ── */
  function editCats(onDone) {
    var list = cats().slice();
    var ov = A.el('.place-ov');
    var box = A.el('.place-box');
    var head = A.el('.place-head');
    head.appendChild(A.el('span.place-title', { text: 'Categories' }));
    head.appendChild(A.el('button.place-x', { html: Icons.svg('close'), onclick: function () { ov.remove(); onDone && onDone(); } }));
    box.appendChild(head);
    var body = A.el('.nb-edit');
    box.appendChild(body);

    function paint() {
      A.clear(body);
      list.forEach(function (c, i) {
        var row = A.el('.nb-cat-row');
        var f = A.UI.field({
          label: null, value: c,
          oninput: function (e) { list[i] = e.target.value; }
        });
        row.appendChild(f);
        row.appendChild(A.el('button.wp-ib.danger', {
          html: Icons.svg('trash'),
          onclick: function () {
            var used = notes().filter(function (n) { return n.cat === list[i]; }).length;
            if (used && !confirm(used + ' note(s) use "' + list[i] + '". Delete the category anyway? The notes stay and move to the first category.')) return;
            list.splice(i, 1); paint();
          }
        }));
        body.appendChild(row);
      });
      body.appendChild(A.el('button.btn.ghost.block', {
        html: Icons.svg('plus') + ' Add category',
        style: { marginTop: '6px' },
        onclick: function () { list.push('New category'); paint(); }
      }));
      body.appendChild(A.el('button.btn.block', {
        html: Icons.svg('check') + ' Save categories',
        style: { marginTop: '10px' },
        onclick: function () {
          var clean = list.map(function (x) { return String(x).trim(); }).filter(Boolean);
          if (!clean.length) { A.toast('Keep at least one category'); return; }
          setCats(clean);
          /* any note pointing at a category that no longer exists moves to the first */
          var all = notes(), moved = 0;
          all.forEach(function (n) { if (clean.indexOf(n.cat) < 0) { n.cat = clean[0]; moved++; } });
          if (moved) setNotes(all);
          ov.remove();
          A.toast(moved ? 'Saved, ' + moved + ' note(s) moved' : 'Saved');
          onDone && onDone();
        }
      }));
    }
    paint();

    ov.appendChild(box);
    ov.addEventListener('click', function (e) { if (e.target === ov) { ov.remove(); onDone && onDone(); } });
    ov._onBack = function () { ov.remove(); onDone && onDone(); };
    document.body.appendChild(ov);
  }

  /* ── the page ── */
  function render(host) {
    var st = A.store.get('notebook.view', { cat: 'All', q: '' });
    function save() { A.store.set('notebook.view', st); }

    var listHost = A.el('div');

    function paint() {
      A.clear(listHost);
      var all = notes();
      var q = String(st.q || '').trim().toLowerCase();
      var shown = all.filter(function (n) {
        if (st.cat !== 'All' && n.cat !== st.cat) return false;
        if (!q) return true;
        return (n.title + ' ' + n.body + ' ' + n.cat).toLowerCase().indexOf(q) >= 0;
      });

      if (!all.length) {
        listHost.appendChild(A.UI.empty('No notes yet. Tap "New note" to write the first one.'));
        return;
      }
      if (!shown.length) {
        /* never a bare "nothing matches" when there IS something: say how many
           are hidden and give one tap to get them back */
        listHost.appendChild(A.UI.empty(
          all.length + (all.length === 1 ? ' note is' : ' notes are') +
          ' stored, but the filter above is hiding ' + (all.length === 1 ? 'it' : 'them') + '.'));
        listHost.appendChild(A.el('button.btn.block', {
          html: Icons.svg('close') + ' Show all notes',
          onclick: function () {
            st.cat = 'All'; st.q = ''; save(); A.Router.refresh();
          }
        }));
        return;
      }

      var filtered = shown.length < all.length;
      listHost.appendChild(A.UI.section(
        shown.length + (shown.length === 1 ? ' note' : ' notes') +
        (filtered ? '  ·  ' + (all.length - shown.length) + ' hidden by the filter' : '')));
      shown.forEach(function (n) {
        var card = A.UI.card(null, 'tight');
        var top = A.el('.nb-top');
        top.appendChild(A.el('span.tag.acc', { text: n.cat }));
        top.appendChild(A.el('span.nb-at', { text: n.at }));
        card.appendChild(top);
        card.appendChild(A.el('.nb-title', { text: n.title }));
        if (n.body) card.appendChild(A.el('.nb-body', { text: n.body }));
        var acts = A.el('.nb-acts');
        acts.appendChild(A.el('button.wp-ib', {
          html: Icons.svg('copy'),
          onclick: function () {
            try { navigator.clipboard.writeText(n.title + '\n' + n.body); A.toast('Note copied'); } catch (e) { A.toast('Copy not available'); }
          }
        }));
        acts.appendChild(A.el('button.wp-ib', {
          html: Icons.svg('grid'),
          onclick: function () { editNote(n, paint); }
        }));
        acts.appendChild(A.el('button.wp-ib.danger', {
          html: Icons.svg('trash'),
          onclick: function () {
            if (!confirm('Delete this note?')) return;
            setNotes(notes().filter(function (x) { return x.id !== n.id; }));
            paint(); A.toast('Deleted');
          }
        }));
        card.appendChild(acts);
        listHost.appendChild(card);
      });
    }

    /* filter by category */
    var chipItems = [{ id: 'All', label: 'All' }].concat(cats().map(function (c) { return { id: c, label: c }; }));
    var chipRow = A.UI.chips(chipItems, st.cat, function (id) { st.cat = id; save(); paint(); });
    chipRow.classList.add('wrap');
    host.appendChild(chipRow);

    host.appendChild(A.UI.search('Search notes…', function (q) { st.q = q; save(); paint(); }));

    var tools = A.el('.split', { style: { marginBottom: '10px' } });
    tools.appendChild(A.el('button.btn.block', {
      html: Icons.svg('plus') + ' New note',
      onclick: function () { editNote(null, function () { A.Router.refresh(); }); }
    }));
    tools.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('grid') + ' Categories',
      onclick: function () { editCats(function () { A.Router.refresh(); }); }
    }));
    host.appendChild(tools);

    host.appendChild(listHost);
    paint();

    host.appendChild(A.UI.note('Notes are held on this device only and are not backed up or sent anywhere. That keeps them private, and it also means a lost or seized phone loses them: keep anything you cannot afford to lose somewhere else as well.'));
  }

  global.ArtNotebook = { render: render };

})(window);
