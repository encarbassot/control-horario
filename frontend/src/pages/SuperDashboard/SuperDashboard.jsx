import "./SuperDashboard.css";

import icoBike from "../../assets/icons/actions/bike.svg";
import { ROUTES } from "../../routes/navigationConfig";
import { Link } from "react-router-dom";
import { URL_GET_ACTIONS, URL_GET_USER_ACTIONS, URL_USERS_LIST } from "../../api/urls";
import { callApi } from "../../api/api";
import { api } from "../../api/ApiAdapter";
import UserCard from "../../components/UserCard/UserCard";
import { useEffect, useState } from "react";




export default function SuperDashboard(){
        const jwt = api.getAccessToken()

        const [actions, setActions] = useState([])
        const [page, setPage] = useState(1)
        const [totalPages, setTotalPages] = useState(1)
        const [total, setTotal] = useState(0)
        const [isLoading, setIsLoading] = useState(false)
        const [selectedUserId, setSelectedUserId] = useState(null)
        const [users, setUsers] = useState([])
        const [expanded, setExpanded] = useState(null)
        const [hoverUserId, setHoverUserId] = useState(null)

        useEffect(()=>{ fetchUsers(); fetchData({page:1}) }, [])
        useEffect(()=>{ fetchData({page:1, user_id:selectedUserId}) }, [selectedUserId])

        async function fetchUsers(){
            const resp = await callApi(URL_USERS_LIST, {limit:1000}, jwt)
            if(resp && resp.success){
                const list = resp.data?.data ?? resp.data ?? []
                setUsers(list)
            }
        }

        async function fetchData({page: _page=1, user_id=null} = {}){
            setIsLoading(true)
            const url = user_id ? URL_GET_USER_ACTIONS : URL_GET_ACTIONS
            const params = user_id ? { user_id, page: _page, limit: 10 } : { page: _page, limit: 10 }
            const resp = await callApi(url, params, jwt)
            setIsLoading(false)
            if(!resp || !resp.success) return
            const { data, page:respPage, total:respTotal, totalPages:respTotalPages } = resp.data
            const items = Array.isArray(data) ? data : (resp.data ?? [])
            if(_page === 1) setActions(items)
            else setActions(prev=>[...prev,...items])
            setPage(respPage || _page)
            setTotal(respTotal || items.length)
            setTotalPages(respTotalPages || 1)
        }

        function safeFormat(body){
            if(!body) return ""
            try{
                let parsed = body
                if(typeof parsed === 'string') parsed = JSON.parse(parsed)
                if(typeof parsed === 'string') parsed = JSON.parse(parsed)
                return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
            }catch(e){
                return body
            }
        }

        async function handleLoadMore(){ if(page >= totalPages) return; await fetchData({page: page+1, user_id: selectedUserId}) }
        function toggleExpand(id){ setExpanded(prev => prev === id ? null : id) }
        function onHoverUser(id){ setHoverUserId(id) }
        function onSelectUser(id){ setSelectedUserId(id) }

        return (
            <div className="SuperDashboard">
                <header className="dashboard-header">
                    <h1>Action Logs</h1>
                    <div className="controls">
                        <label>Filter by user:</label>
                        <select value={selectedUserId||""} onChange={e=>onSelectUser(e.target.value||null)}>
                            <option value="">All users</option>
                            {users.map(u=> <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                        </select>
                        {selectedUserId && <button onClick={()=>setSelectedUserId(null)}>Clear</button>}
                    </div>
                </header>

                <section className="history">
                    <p className="summary">Mostrando {actions.length} de {total}</p>
                    <ul className="actions-list">
                        {actions.map(a=> (
                            <li className="action-item" key={a.log_id}>
                                <div className="row">
                                    <div className="meta">
                                        <div className="when">{new Date(a.created_at).toLocaleString()}</div>
                                        <div className="path"><b>{a.method}</b> {a.path} <span className="status">{a.status}</span></div>
                                    </div>
                                    <div className="who">
                                      <UserCard user={{ id: a.user_id, name: a.user_name, email: a.user_email, phone: a.user_phone }} onClick={()=>onSelectUser(a.user_id)} />
                                    </div>
                                    <div className="actions">
                                        <button className="toggle" onClick={()=>toggleExpand(a.log_id)}>{expanded===a.log_id? 'Hide' : 'Show'}</button>
                                    </div>
                                </div>

                                {expanded===a.log_id && (
                                    <div className="expanded">
                                        <div className="code-block">
                                            <h4>Request</h4>
                                            <pre>{safeFormat(a.request_body)}</pre>
                                        </div>
                                        <div className="code-block">
                                            <h4>Response</h4>
                                            <pre>{safeFormat(a.response_body)}</pre>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    <footer className="history-footer">
                        {page < totalPages && <button onClick={handleLoadMore} disabled={isLoading}>Load More</button>}
                    </footer>
                </section>
            </div>
        )
    

}