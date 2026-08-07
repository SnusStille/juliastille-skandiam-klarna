import { cn } from '@/lib/utils';
import {
  BID_STATUS_LABEL,
  CONTACT_STAGE_LABEL,
  CONTACT_TYPE_LABEL,
  DOCUMENT_CATEGORY_LABEL,
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TEMPLATE_CATEGORY_LABEL,
  VIEWING_TYPE_LABEL,
  type BidStatus,
  type ContactStage,
  type ContactType,
  type DocumentCategory,
  type PropertyStatus,
  type PropertyType,
  type TaskPriority,
  type TaskStatus,
  type TemplateCategory,
  type ViewingType,
} from '@/lib/types';

const NEUTRAL = 'border-line bg-raised text-muted';

const PROPERTY_STATUS_STYLE: Record<PropertyStatus, string> = {
  kommande: 'border-sky/30 bg-sky/10 text-sky',
  till_salu: 'border-forest/30 bg-forest/10 text-forest',
  budgivning: 'border-brass/40 bg-brass/12 text-brass',
  sald: 'border-ink/20 bg-ink/8 text-ink',
  tillbakadragen: 'border-clay/30 bg-clay/10 text-clay',
};

const CONTACT_STAGE_STYLE: Record<ContactStage, string> = {
  ny: 'border-sky/30 bg-sky/10 text-sky',
  kontaktad: 'border-line bg-raised text-muted',
  mote_bokat: 'border-brass/40 bg-brass/12 text-brass',
  intag: 'border-brass/40 bg-brass/12 text-brass',
  uppdrag: 'border-forest/30 bg-forest/10 text-forest',
  avslutad: 'border-ink/20 bg-ink/8 text-ink',
};

const TASK_STATUS_STYLE: Record<TaskStatus, string> = {
  att_gora: 'border-line bg-raised text-muted',
  pagar: 'border-brass/40 bg-brass/12 text-brass',
  klar: 'border-forest/30 bg-forest/10 text-forest',
};

const TASK_PRIORITY_STYLE: Record<TaskPriority, string> = {
  lag: 'border-line bg-raised text-faint',
  normal: 'border-sky/30 bg-sky/10 text-sky',
  hog: 'border-clay/30 bg-clay/10 text-clay',
};

const BID_STATUS_STYLE: Record<BidStatus, string> = {
  aktivt: 'border-line bg-raised text-muted',
  hogsta: 'border-brass/40 bg-brass/12 text-brass',
  avslaget: 'border-clay/30 bg-clay/10 text-clay',
  accepterat: 'border-forest/30 bg-forest/10 text-forest',
};

function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn('chip', className)}>{children}</span>;
}

export const PropertyStatusBadge = ({ status }: { status: PropertyStatus }) => (
  <Chip className={PROPERTY_STATUS_STYLE[status]}>
    {PROPERTY_STATUS_LABEL[status]}
  </Chip>
);

export const PropertyTypeBadge = ({ type }: { type: PropertyType }) => (
  <Chip className={NEUTRAL}>{PROPERTY_TYPE_LABEL[type]}</Chip>
);

export const ContactStageBadge = ({ stage }: { stage: ContactStage }) => (
  <Chip className={CONTACT_STAGE_STYLE[stage]}>{CONTACT_STAGE_LABEL[stage]}</Chip>
);

export const ContactTypeBadge = ({ type }: { type: ContactType }) => (
  <Chip className={NEUTRAL}>{CONTACT_TYPE_LABEL[type]}</Chip>
);

export const TaskStatusBadge = ({ status }: { status: TaskStatus }) => (
  <Chip className={TASK_STATUS_STYLE[status]}>{TASK_STATUS_LABEL[status]}</Chip>
);

export const TaskPriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <Chip className={TASK_PRIORITY_STYLE[priority]}>
    {TASK_PRIORITY_LABEL[priority]}
  </Chip>
);

export const BidStatusBadge = ({ status }: { status: BidStatus }) => (
  <Chip className={BID_STATUS_STYLE[status]}>{BID_STATUS_LABEL[status]}</Chip>
);

export const ViewingTypeBadge = ({ type }: { type: ViewingType }) => (
  <Chip
    className={
      type === 'oppen'
        ? 'border-brass/40 bg-brass/12 text-brass'
        : type === 'digital'
          ? 'border-sky/30 bg-sky/10 text-sky'
          : NEUTRAL
    }
  >
    {VIEWING_TYPE_LABEL[type]}
  </Chip>
);

export const DocumentCategoryBadge = ({
  category,
}: {
  category: DocumentCategory;
}) => <Chip className={NEUTRAL}>{DOCUMENT_CATEGORY_LABEL[category]}</Chip>;

export const TemplateCategoryBadge = ({
  category,
}: {
  category: TemplateCategory;
}) => (
  <Chip className="border-brass/35 bg-brass/10 text-brass">
    {TEMPLATE_CATEGORY_LABEL[category]}
  </Chip>
);

export const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
    {children}
  </span>
);
