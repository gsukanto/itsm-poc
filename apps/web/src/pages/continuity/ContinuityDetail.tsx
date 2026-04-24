import React from 'react';
import { useContinuityPlansQuery } from '../../services/api';
import { ListItemDetail } from '../../components/GenericDetail';

export function ContinuityDetail() {
  const { data, isFetching } = useContinuityPlansQuery();
  return <ListItemDetail title="Continuity Plan" items={data} loading={isFetching} backTo="/continuity" highlight={['serviceKey', 'rtoMinutes', 'rpoMinutes']} />;
}
