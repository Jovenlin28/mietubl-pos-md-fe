import React, { useState, useEffect, createContext } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Box,
  Avatar,
  IconButton,
  InputBase,
  Paper,
  Badge,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import axiosInstance from "../configs/axiosConfig";

// Permissions context
export const PermissionsContext = createContext<{
  [key: string]: { [key: string]: boolean };
} | null>(null);

// new: User context to provide decoded token
export const UserContext = createContext<any | null>(null);

// Helper to decode JWT (without verifying signature)
function decodeJWT(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded;
  } catch {
    return null;
  }
}

const drawerWidth = 220;
const collapsedWidth = 64;

interface TopHeaderProps {
  isMobile: boolean;
}

const TopHeader: React.FC<TopHeaderProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // show avatar from token (or initials fallback)
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);
  const [initials, setInitials] = useState<string>("U");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAvatarSrc(undefined);
        setInitials("U");
        return;
      }
      const decoded: any = decodeJWT(token);
      const av = decoded?.avatar || decoded?.avatarUrl || null;
      const name =
        decoded?.fullName ||
        decoded?.full_name ||
        decoded?.name ||
        decoded?.username ||
        "";
      if (av) {
        setAvatarSrc(av);
      } else {
        // derive initials from name
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const i =
          parts.length === 0
            ? "U"
            : parts.length === 1
            ? parts[0].slice(0, 2).toUpperCase()
            : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        setInitials(i);
        setAvatarSrc(undefined);
      }
    } catch {
      setAvatarSrc(undefined);
      setInitials("U");
    }
  }, []);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        px: 3,
        py: 1.5,
        gap: 2,
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {!isMobile && (
        <Paper
          component="form"
          sx={{
            p: "2px 8px",
            display: "flex",
            alignItems: "center",
            width: 240,
            boxShadow: "none",
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            mr: "auto",
          }}
        >
          <SearchIcon sx={{ color: "#888" }} />
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search"
            inputProps={{ "aria-label": "search" }}
          />
        </Paper>
      )}

      <IconButton>
        <Badge
          color="default"
          sx={{ "& .MuiBadge-dot": { bgcolor: "error.main" } }}
        >
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
      <IconButton>
        <SettingsOutlinedIcon />
      </IconButton>
      <IconButton onClick={handleAvatarClick}>
        <Avatar
          sx={{ width: 32, height: 32, backgroundColor: initials ? '#f39c12' : '', fontSize: 14 }}
          src={avatarSrc}
          alt="User avatar"
        >
          {!avatarSrc && initials}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{
          sx: { py: 1 }
        }}
      >
        <MenuItem
          onClick={handleProfile}
          sx={{ px: 3, py: 1.5, minWidth: 120 }}
        >
          My Profile
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{ px: 3, py: 1.5, minWidth: 120 }}
        >
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();
  // Use 800px as the mobile breakpoint instead of theme.breakpoints.down("sm")
  const isMobile = useMediaQuery("(max-width:800px)");

  // Permissions context state
  const [permissions, setPermissions] = useState<{
    [key: string]: { [key: string]: boolean };
  } | null>(null);

  // store decoded token in state for UserContext
  const [decodedTokenForContext, setDecodedTokenForContext] = useState<any | null>(null);

  useEffect(() => {
    // Get role from JWT token in localStorage
    let role: string | undefined;
    let claims: any = null;
    const token = localStorage.getItem("token");
    if (token) {
      claims = decodeJWT(token);
      role = claims?.role;
      // keep decoded token in state for context consumer
      setDecodedTokenForContext(claims);
    }
    const fetchPermissions = async () => {
      if (!role || role === "SuperAdmin") return;
      try {
        // First, get the role object by name
        const roleRes = await axiosInstance.get(
          `/roles/${claims?.role_id}`
        );
        const roleObj = roleRes.data;
        setPermissions(roleObj.permissions || {});
      } catch {
        setPermissions({});
      }
    };
    fetchPermissions();
  }, []);

  // ensure decodedTokenForContext is null if token removed
  useEffect(() => {
    if (!localStorage.getItem("token")) setDecodedTokenForContext(null);
  }, []);

  return (
    <UserContext.Provider value={decodedTokenForContext}>
      <PermissionsContext.Provider value={permissions}>
        <div style={{ display: "flex" }}>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <main
            style={{
              overflowX: "hidden",
              flex: 1,
              minHeight: "100vh",
              marginLeft: 0,
              transition: "margin-left 0.2s",
              padding: 0,
              background: "#F7F7F7",
            }}
          >
            <TopHeader isMobile={isMobile} />
            <Outlet />
          </main>
        </div>
      </PermissionsContext.Provider>
    </UserContext.Provider>
  );
};

export default DashboardLayout;
