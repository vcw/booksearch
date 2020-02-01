const fetch = require('node-fetch');
const express = require('express');
const { PORT = 3000 } = process.env;
const app = express();

app.listen(PORT, () => {
  console.log(`App is listening on port: ${PORT}`);
});

app.get('/', (req, res) => {
  const isbn = req.query.isbn;
  // const token = 'eyJraWQiOiJwcmltb0V4cGxvcmVQcml2YXRlS2V5LTA3TkxSIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJQcmltbyIsImp0aSI6IiIsImV4cCI6MTU4MDUxOTQzOSwiaWF0IjoxNTgwNDMzMDM5LCJ1c2VyIjoiYW5vbnltb3VzLTAxMzFfMDExMDM5IiwidXNlck5hbWUiOm51bGwsInVzZXJHcm91cCI6IkdVRVNUIiwiYm9yR3JvdXBJZCI6bnVsbCwidWJpZCI6bnVsbCwiaW5zdGl0dXRpb24iOiIwN05MUiIsInZpZXdJbnN0aXR1dGlvbkNvZGUiOiIwN05MUiIsImlwIjoiMTg1LjIxOC4xMDkuNTUiLCJwZHNSZW1vdGVJbnN0IjpudWxsLCJvbkNhbXB1cyI6ImZhbHNlIiwibGFuZ3VhZ2UiOiJydV9SVSIsImF1dGhlbnRpY2F0aW9uUHJvZmlsZSI6IiIsInZpZXdJZCI6IjA3TkxSX1ZVMSIsImlsc0FwaUlkIjpudWxsLCJzYW1sU2Vzc2lvbkluZGV4IjoiIiwiand0QWx0ZXJuYXRpdmVCZWFjb25JbnN0aXR1dGlvbkNvZGUiOiIwN05MUiJ9.xS_Z91I84YtxxFqqtlJtAbEZ3OL89VmeGwQ-EWn1y3R_3EEWUnZtueXd8KjEokAHyssCaUN_cfKL7VbRv4JU8A';
  const token = req.query.token;

  if (!isbn) {
    res.send({error: 'no isbn'})
    return;
  }

  if (!token) {
    res.send({error: 'no token'});
    return;
  }

  search(isbn, token)
  .then((response) => {
    res.send(response);
  });
});

function search(isbn, token){
  const url = `https://primo.nlr.ru/primo_library/libweb/webservices/rest/primo-explore/v1/pnxs?blendFacetsSeparately=false&getMore=0&inst=07NLR&lang=ru_RU&limit=10&mode=advanced&newspapersActive=true&newspapersSearch=false&offset=0&pcAvailability=true&q=isbn,contains,${isbn},AND&qExclude=&qInclude=&refEntryActive=false&rtaLinks=true&scope=default_scope&skipDelivery=Y&sort=rank&tab=default_tab&vid=07NLR_VU1`;

  return fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then((response) => response.json())
  .then((response) => response.docs[0].pnx)
  .then((response) => processResponse(response))
  .catch((error) => console.log(error));
}

function processResponse(res) {
  if (res) {
    const pagesRegEx = /^\d{1,5}/;
    const pages = res.display.lds06[0].match(pagesRegEx)[0];
    return {
      title: res.display.title[0],
      year: res.display.creationdate[0],
      publisher: res.display.publisher[0],
      author: processAuthors(res.search.creatorcontrib),
      pages
    }
  }
  return {error: 'not found'}
}

function processAuthors(authorsArray) {
  const authorRegEx = /^([А-ЯЁа-яё-]+\s[А-ЯЁа-яё]\.)\s?([А-ЯЁа-яё]\.)?/;
  return authorsArray.reduce((result, currentAuthor) => {
    const author = currentAuthor.match(authorRegEx);
    if (author) {
      result.push(author[0].replace(authorRegEx, '$1$2'));
    }
    return result;
    ;
  }, []).join(',');
}