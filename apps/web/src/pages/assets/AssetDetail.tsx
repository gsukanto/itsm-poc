import React from 'react';
import { useParams } from 'react-router-dom';
import { useAssetQuery } from '../../services/api';
import { DetailView } from '../../components/GenericDetail';

export function AssetDetail() {
  const { id } = useParams();
  const { data, isFetching } = useAssetQuery(id!);
  return <DetailView title={data?.name ?? 'Asset'} data={data} loading={isFetching} backTo="/assets" highlight={['refNo', 'status', 'type']} />;
}
