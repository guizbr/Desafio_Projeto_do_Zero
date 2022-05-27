import { useEffect, useState } from "react";
import { FiCalendar, FiUser } from "react-icons/fi";
import { GetStaticProps } from 'next';
import Head from "next/head";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from "next/link";
import React from "react";

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination);
  const [nextPage, setNextPage] = useState(null);

  useEffect(() => {
    if (nextPage != null){
       fetch(nextPage)
        .then(response => response.json())
        .then(data => 
            {
              let otherPosts = data.results.map(post => { return {
                uid: post.uid,
                first_publication_date: format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                }),
                data: {
                  title: post.data.title,
                  subtitle: post.data.subtitle,
                  author: post.data.author
                }
              }});
           
              setNextPage(data.next_page);
              setPosts({
                next_page: data.next_page,
                results: [...posts.results, ...otherPosts]
              });
            }
          )
    }
  });

  return (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          { posts.results.map(post => (
            <React.Fragment key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.info}>
                    <time><FiCalendar size={20} /> &nbsp; {format(new Date(post.first_publication_date),'dd MMM yyyy', {locale: ptBR})}</time> <span><FiUser size={20} /> &nbsp; {post.data.author}</span>
                  </div>
                </a>
              </Link>
            </React.Fragment>
          )) }
        </div>
        {
          posts.next_page !== null ?
            <div className={styles.containerMoreButton}>
              <button type="button" className={styles.moreButton} onClick={() => setNextPage(posts.next_page)}>
                <span>Carregar mais posts</span>
              </button>
            </div>
            :
            <br />
        }
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('post', {
    orderings: {
      field: 'document.first_publication_date',
      direction: 'desc'
    },
    pageSize: 3,
    page: 1
  });

  //console.log(JSON.stringify(postsResponse, null, 2));
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  });

  const nextPage = postsResponse.next_page;

  return {
    props: {
      postsPagination:{
        next_page: nextPage,
        results: posts
      }
    }
  }
};
