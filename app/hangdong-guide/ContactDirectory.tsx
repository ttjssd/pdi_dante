"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type ContactType = "partner" | "manager";

type LocalContact = {
  id: string;
  type: ContactType;
  name: string;
  phone: string;
  label: string;
  note: string;
};

const STORAGE_KEY = "pdi-hangdong-contacts-v1";
const emptyDraft: Omit<LocalContact, "id"> = {
  type: "partner",
  name: "",
  phone: "",
  label: "",
  note: "",
};

export default function ContactDirectory() {
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setContacts(stored.filter(isContact));
    } catch {
      setMessage("저장된 연락처를 불러오지 못했습니다.");
    }
  }, []);

  const grouped = useMemo(
    () => ({
      partner: contacts.filter((contact) => contact.type === "partner"),
      manager: contacts.filter((contact) => contact.type === "manager"),
    }),
    [contacts],
  );

  const saveContacts = (next: LocalContact[]) => {
    setContacts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const submit = () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      setMessage("이름과 연락처를 입력해 주세요.");
      return;
    }

    const normalized = {
      ...draft,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      label: draft.label.trim(),
      note: draft.note.trim(),
    };

    if (editingId) {
      saveContacts(contacts.map((contact) => (
        contact.id === editingId ? { ...normalized, id: editingId } : contact
      )));
      setMessage("연락처를 수정했습니다.");
    } else {
      saveContacts([...contacts, { ...normalized, id: crypto.randomUUID() }]);
      setMessage("이 PC에 연락처를 저장했습니다.");
    }

    setDraft(emptyDraft);
    setEditingId(null);
  };

  const editContact = (contact: LocalContact) => {
    setDraft({
      type: contact.type,
      name: contact.name,
      phone: contact.phone,
      label: contact.label,
      note: contact.note,
    });
    setEditingId(contact.id);
    setMessage("선택한 연락처를 수정할 수 있습니다.");
  };

  const deleteContact = (contact: LocalContact) => {
    if (!window.confirm(`${contact.name} 연락처를 삭제할까요?`)) return;
    saveContacts(contacts.filter((item) => item.id !== contact.id));
    if (editingId === contact.id) {
      setDraft(emptyDraft);
      setEditingId(null);
    }
    setMessage("연락처를 삭제했습니다.");
  };

  const exportContacts = () => {
    const blob = new Blob([JSON.stringify({ version: 1, contacts }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pdi-contacts-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("연락처 JSON을 내보냈습니다.");
  };

  const importContacts = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const imported = Array.isArray(parsed) ? parsed : parsed.contacts;
      if (!Array.isArray(imported)) throw new Error("invalid");
      const validContacts = imported.filter(isContact);
      if (!validContacts.length && imported.length) throw new Error("invalid");
      saveContacts(validContacts);
      setMessage(`${validContacts.length}개 연락처를 이 PC로 가져왔습니다.`);
    } catch {
      setMessage("올바른 PDI 연락처 JSON 파일이 아닙니다.");
    }
  };

  return (
    <section className="platform-section hangdong-contact-section page-enter page-delay-2">
      <div className="platform-section-heading">
        <div><span className="section-index">02</span><h2>연락처 디렉터리</h2></div>
        <p>연락처는 현재 PC 브라우저 저장소에만 보관됩니다.</p>
      </div>

      <div className="hangdong-contact-toolbar">
        <div>
          <strong>LOCAL CONTACT STORAGE</strong>
          <span>GitHub와 설치파일에는 실제 연락처가 포함되지 않습니다.</span>
        </div>
        <div>
          <button type="button" onClick={() => importRef.current?.click()}>JSON 가져오기</button>
          <button type="button" onClick={exportContacts} disabled={!contacts.length}>JSON 내보내기</button>
          <input ref={importRef} type="file" accept="application/json,.json" onChange={importContacts} hidden />
        </div>
      </div>

      <div className="hangdong-contact-editor">
        <label>
          구분
          <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as ContactType })}>
            <option value="partner">협력 업체</option>
            <option value="manager">판매 매니저</option>
          </select>
        </label>
        <label>
          이름
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="업체명 또는 매니저명" />
        </label>
        <label>
          연락처
          <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="전화번호 또는 연락 방법" />
        </label>
        <label>
          담당 업무 / 멘션
          <input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} placeholder="예: 유리 복원 또는 @아이디" />
        </label>
        <label className="contact-note-field">
          참고사항
          <textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="결제, 요청 절차 등 필요한 메모" />
        </label>
        <div className="hangdong-contact-editor-actions">
          {editingId && (
            <button type="button" className="contact-ghost-button" onClick={() => { setDraft(emptyDraft); setEditingId(null); }}>
              수정 취소
            </button>
          )}
          <button type="button" className="contact-save-button" onClick={submit}>
            {editingId ? "수정 저장" : "연락처 등록"}
          </button>
        </div>
      </div>

      {message && <p className="hangdong-contact-message" role="status">{message}</p>}

      <div className="hangdong-contact-layout">
        <ContactPanel title="협력 업체 연락처" label="PARTNER NETWORK" contacts={grouped.partner} onEdit={editContact} onDelete={deleteContact} />
        <ContactPanel title="판매 매니저 연락처" label="SALES MANAGERS" contacts={grouped.manager} onEdit={editContact} onDelete={deleteContact} />
      </div>
      <p className="hangdong-contact-note">업무용 노트북에서는 최초 한 번 직접 등록하거나 JSON 파일을 가져와 사용해 주세요.</p>
    </section>
  );
}

function ContactPanel({
  title,
  label,
  contacts,
  onEdit,
  onDelete,
}: {
  title: string;
  label: string;
  contacts: LocalContact[];
  onEdit: (contact: LocalContact) => void;
  onDelete: (contact: LocalContact) => void;
}) {
  return (
    <article className="hangdong-contact-panel">
      <header><span>{label}</span><h3>{title}</h3></header>
      {contacts.length ? (
        <div className="hangdong-contact-list">
          {contacts.map((contact, index) => (
            <div className="hangdong-contact-row" key={contact.id}>
              <span className="hangdong-contact-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{contact.name}</strong>
                <a className="contact-phone-link" href={toPhoneHref(contact.phone)}>{contact.phone}</a>
                {contact.label && <small>{contact.label}</small>}
                {contact.note && <em>{contact.note}</em>}
                <div className="contact-row-actions">
                  <button type="button" onClick={() => onEdit(contact)}>수정</button>
                  <button type="button" onClick={() => onDelete(contact)}>삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="hangdong-contact-empty">
          <strong>등록된 연락처가 없습니다.</strong>
          <p>위 입력칸에서 이 PC에 사용할 연락처를 등록해 주세요.</p>
        </div>
      )}
    </article>
  );
}

function toPhoneHref(value: string) {
  const phone = value.replace(/[^\d+]/g, "");
  return phone.length >= 8 ? `tel:${phone}` : undefined;
}

function isContact(value: unknown): value is LocalContact {
  if (!value || typeof value !== "object") return false;
  const contact = value as Partial<LocalContact>;
  return (
    typeof contact.id === "string"
    && (contact.type === "partner" || contact.type === "manager")
    && typeof contact.name === "string"
    && typeof contact.phone === "string"
    && typeof contact.label === "string"
    && typeof contact.note === "string"
  );
}
