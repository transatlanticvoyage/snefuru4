import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import MesagenClient from './pclient';

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get the current user from the server
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return {
        title: 'mesagen - Snefuru',
      };
    }

    // Get user's internal ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!userData) {
      return {
        title: 'mesagen - Snefuru',
      };
    }

    // Fetch the gcon_piece to get title info
    const { data: gconPiece } = await supabase
      .from('gcon_pieces')
      .select('mud_title, asn_sitespren_base')
      .eq('id', id)
      .eq('fk_users_id', userData.id)
      .single();

    // Generate title based on available data
    if (gconPiece?.mud_title && gconPiece?.asn_sitespren_base) {
      return {
        title: `mesagen_${gconPiece.mud_title}_${gconPiece.asn_sitespren_base}`,
      };
    } else if (gconPiece?.asn_sitespren_base) {
      return {
        title: `mesagen_${gconPiece.asn_sitespren_base}`,
      };
    } else {
      return {
        title: 'mesagen - Snefuru',
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'mesagen - Snefuru',
    };
  }
}

export default function MesagenPage({ params }: Props) {
  return <MesagenClient />;
}