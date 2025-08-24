import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import EdableClient from './pclient';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get the current user from the server
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return {
        title: 'edable - Snefuru',
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
        title: 'edable - Snefuru',
      };
    }

    // Fetch the gcon_piece to get title info
    const { data: gconPiece } = await supabase
      .from('gcon_pieces')
      .select('aval_title, asn_sitespren_base')
      .eq('id', id)
      .eq('fk_users_id', userData.id)
      .single();

    // Generate title based on available data
    if (gconPiece?.aval_title && gconPiece?.asn_sitespren_base) {
      return {
        title: `edable_${gconPiece.aval_title}_${gconPiece.asn_sitespren_base}`,
      };
    } else if (gconPiece?.asn_sitespren_base) {
      return {
        title: `edable_${gconPiece.asn_sitespren_base}`,
      };
    } else {
      return {
        title: 'edable',
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'edable - Snefuru',
    };
  }
}

export default function EdablePage({ params }: Props) {
  return <EdableClient />;
}