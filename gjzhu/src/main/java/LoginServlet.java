import java.io.*;
import java.sql.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;

@WebServlet("/LoginServlet")
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String action = request.getParameter("action");
        String username = request.getParameter("username");
        String password = request.getParameter("password");

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        if (action == null || username == null || password == null ||
                username.trim().isEmpty() || password.trim().isEmpty()) {
            out.print("{\"success\":false,\"message\":\"参数不完整\"}");
            return;
        }

        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            conn = DBUtil.getConnection();
            conn.setAutoCommit(true);

            if ("login".equals(action)) {
                String sql = "SELECT * FROM user_account WHERE user_name = ? AND user_password = ?";
                pstmt = conn.prepareStatement(sql);
                pstmt.setString(1, username);
                pstmt.setString(2, password);
                rs = pstmt.executeQuery();

                if (rs.next()) {
                    HttpSession session = request.getSession();
                    session.setAttribute("username", username);
                    out.print("{\"success\":true,\"message\":\"登录成功\"}");
                } else {
                    out.print("{\"success\":false,\"message\":\"账号或密码错误\"}");
                }

            } else if ("register".equals(action)) {
                String checkSql = "SELECT COUNT(*) FROM user_account WHERE user_name = ?";
                PreparedStatement checkStmt = conn.prepareStatement(checkSql);
                checkStmt.setString(1, username);
                ResultSet checkRs = checkStmt.executeQuery();

                if (checkRs.next() && checkRs.getInt(1) > 0) {
                    checkRs.close();
                    checkStmt.close();
                    out.print("{\"success\":false,\"message\":\"此用户名已被使用\"}");
                    return;
                }

                checkRs.close();
                checkStmt.close();

                String insertSql = "INSERT INTO user_account (user_name, user_password) VALUES (?, ?)";
                PreparedStatement insertStmt = conn.prepareStatement(insertSql);
                insertStmt.setString(1, username);
                insertStmt.setString(2, password);
                int rows = insertStmt.executeUpdate();

                if (rows > 0) {
                    out.print("{\"success\":true,\"message\":\"注册成功\"}");
                } else {
                    out.print("{\"success\":false,\"message\":\"注册失败\"}");
                }

                insertStmt.close();
            } else {
                out.print("{\"success\":false,\"message\":\"无效的操作\"}");
            }

        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"success\":false,\"message\":\"数据库错误: " + e.getMessage() + "\"}");
        } finally {
            if (rs != null) try { rs.close(); } catch (SQLException e) {}
            if (pstmt != null) try { pstmt.close(); } catch (SQLException e) {}
            DBUtil.close(conn);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/plain");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().print("LoginServlet is running");
    }
}