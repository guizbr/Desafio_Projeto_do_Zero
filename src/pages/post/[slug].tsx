import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { Fragment } from 'react';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string | null;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  const dtFormat = format(new Date(post.first_publication_date), 'dd MMM yyyy', {
    locale: ptBR,
  });

  const qtdPalavras = post.data.content.reduce((acc, element, index) => {
    let heading = null;
    let text = null;
    let contHeading = 0;
    let contText = 0;

    if(element.heading !== null){
      heading = element.heading.replace(/(\r\n|\n|\r)/g," ").trim();
      contHeading = heading.split(/\s+/g).length;
    }

    text = RichText.asText(element.body).replace(/(\r\n|\n|\r)/g," ").trim();
    contText = text.split(/\s+/g).length;

    return acc + (contHeading + contText);
  }, 0);

  const tempoLeitura = Math.ceil(qtdPalavras/200);
  
  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      <div className={styles.imgContainer}>
        <img src={`${post.data.banner.url}`} alt="banner" />
      </div>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <time><FiCalendar size={20} /> &nbsp; { dtFormat }</time> <span><FiUser size={20} /> &nbsp; {post.data.author}</span> <span><FiClock size={20} /> &nbsp; { tempoLeitura } min</span>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map((content, index) => (
              <Fragment key={index}>
                <h2 key={index}>{content.heading}</h2>
                {content.body.map((paragraph, index) => (
                  <p key={index}>{paragraph.text}</p>
                ))}
              </Fragment>
            ))}
          </div>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('post', {
    orderings: {
      field: 'document.first_publication_date',
      direction: 'desc'
    },
    pageSize: 3,
    page: 1
  });

  const paths = posts.results.map((post) => ({
    params: { slug: post.uid },
  }))

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content
    }
  }
  console.log({post});

  return {
    props: {
      post
    },
    redirect: 60 * 30 // 30 minutes
  }
};
